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
        console.log('Before subscribe', requestInit)
        try {
          const request: TransmitRequest = { headers: {} }
          console.log('Request', request)
          // Handle authentication through custom function or localStorage
          let token = null
          console.log('Get access token', getAccessToken)
          if (getAccessToken) {
            token = getAccessToken()
            console.log('Token', token)
            if (token instanceof Promise) {
              console.warn('[Transmit] getAccessToken returned a Promise, but beforeSubscribe must be synchronous. Token will be ignored.')
              token = null
            }
          } else if (accessTokenKey) {
            token = localStorage.getItem(accessTokenKey)
          }
          console.log('Token2', token)

          if (token) {
            request.headers = {
              ...request.headers,
              Authorization: `Bearer ${token}`,
            }
          }

          console.log('Request', request)
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
    async (channel: string, callback: (event: any) => void) => {
      if (enableLogging) {
        console.log('[Transmit] - Subscribing to', channel)
      }

      let sub = subscriptions.current.get(channel)

      if (!sub) {
        if (enableLogging) {
          console.log('[Transmit] - Creating new subscription for', channel)
        }

        const subscription = transmit.subscription(channel)

        // Set up message handling immediately
        subscription.onMessage((event) => {
          handleMessage(channel, event)
          callback(event)
        })

        // Create subscription immediately
        try {
          if (enableLogging) {
            console.log('[Transmit] - Initializing subscription for', channel)
          }

          // Create and store the subscription
          await subscription.create()
          console.log('Subscription created', subscription.isCreated)

          sub = {
            count: 0,
            subscription,
          }
          subscriptions.current.set(channel, sub)

          if (enableLogging) {
            console.log('[Transmit] - Subscription stored for', channel)
          }
        } catch (error) {
          console.error('[Transmit] - Error during subscription setup:', error)
          throw new Error(`Failed to set up subscription for channel ${channel}`)
        }
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