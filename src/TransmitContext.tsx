import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { Transmit } from '@adonisjs/transmit-client'
import { TransmitContextValue, TransmitProviderProps, TransmitRequest } from './types'

/** Context for sharing Transmit instance and subscription functionality */
const TransmitContext = createContext<TransmitContextValue | null>(null)

/**
 * Provider component that manages Transmit instance and subscriptions
 * Handles authentication, connection lifecycle, and subscription cleanup
 */
export function TransmitProvider({
  children,
  baseUrl,
  beforeSubscribe,
  onMessage,
  accessTokenKey = 'access_token',
  getAccessToken,
  enableLogging = false,
}: TransmitProviderProps) {
  // Create a persistent Transmit instance
  const transmit = useRef<Transmit>(
    new Transmit({
      baseUrl,
      beforeSubscribe: (requestInit) => {
        try {
          const request: TransmitRequest = { headers: {} }
          // Handle authentication through custom function or localStorage
          let token = null
          if (getAccessToken) {
            token = getAccessToken()
            if (token instanceof Promise) {
              console.warn('[Transmit] getAccessToken returned a Promise, but beforeSubscribe must be synchronous. Token will be ignored.')
              token = null
            }
          } else if (accessTokenKey) {
            token = localStorage.getItem(accessTokenKey)
          }

          if (token) {
            request.headers = {
              ...request.headers,
              Authorization: `Bearer ${token}`,
            }
          }

          beforeSubscribe?.(request)

          // Apply headers to the actual request
          if (request.headers) {
            requestInit.headers = request.headers
          }
        } catch (error) {
          console.error('Error in beforeSubscribe:', error)
        }
      },
    })
  ).current

  // Track active subscriptions with reference counting
  const subscriptions = useRef<
    Map<string, { count: number; subscription: ReturnType<Transmit['subscription']> }>
  >(new Map())

  // Set up connection lifecycle logging
  useEffect(() => {
    if (enableLogging) {
      transmit.on('connected', () => console.log('[SSE] connected'))
      transmit.on('disconnected', () => console.log('[SSE] disconnected'))
      transmit.on('initializing', () => console.log('[SSE] initializing...'))
      transmit.on('reconnecting', () => console.log('[SSE] reconnecting...'))
    }

    // Clean up on unmount
    return () => {
      transmit.close()
    }
  }, [])

  // Handle incoming messages and logging
  const handleMessage = useCallback(
    (channel: string, event: any) => {
      if (enableLogging) {
        console.log(`[Transmit] ${channel} message:`, event)
      }
      onMessage?.(channel, event)
    },
    [onMessage, enableLogging]
  )

  // Subscribe to a channel with reference counting for cleanup
  const subscribe = useCallback(
    (channel: string, callback: (event: any) => void) => {
      if (enableLogging) {
        console.log('[Transmit] - Subscribing to', channel)
      }

      let sub = subscriptions.current.get(channel)

      if (!sub) {
        const subscription = transmit.subscription(channel)
        sub = {
          count: 0,
          subscription,
        }
        subscriptions.current.set(channel, sub)

        if (enableLogging) {
          console.log('[Transmit] - Created new subscription for', channel)
        }

        // Set up message handling
        subscription.onMessage((event) => {
          handleMessage(channel, event)
          callback(event)
        })

        // Create the subscription
        Promise.resolve().then(async () => {
          if (enableLogging) {
            console.log('[Transmit] - Creating subscription for', channel)
          }
          try {
            await subscription.create()
            if (enableLogging) {
              console.log('[Transmit] - Subscription created successfully for', channel)
            }
          } catch (error) {
            console.error('[Transmit] - Failed to create subscription:', error)
            // Remove failed subscription
            subscriptions.current.delete(channel)
          }
        })
      }

      // Increment reference count
      sub.count++

      if (enableLogging) {
        console.log('[Transmit] - Subscription reference count for', channel, ':', sub.count)
      }

      // Return cleanup function
      return () => {
        if (!subscriptions.current.has(channel)) return

        const sub = subscriptions.current.get(channel)!
        sub.count--

        if (enableLogging) {
          console.log('[Transmit] - Unsubscribing from', channel, 'count:', sub.count)
        }

        // Clean up when no more subscribers
        if (sub.count === 0) {
          if (enableLogging) {
            console.log('[Transmit] - Deleting subscription for', channel)
          }
          sub.subscription.delete()
          subscriptions.current.delete(channel)
        }
      }
    },
    [handleMessage, enableLogging]
  )

  return (
    <TransmitContext.Provider value={{ transmit, subscribe }}>
      {children}
    </TransmitContext.Provider>
  )
}

/**
 * Hook to access the Transmit context
 * Must be used within a TransmitProvider
 */
export function useTransmit() {
  const context = useContext(TransmitContext)
  if (!context) {
    throw new Error('useTransmit must be used within a TransmitProvider')
  }
  return context
} 