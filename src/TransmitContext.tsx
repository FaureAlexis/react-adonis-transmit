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
        let token = null;
        if (getAccessToken) {
          const accessToken = getAccessToken();
          if (accessToken instanceof Promise) {
            console.error("[Transmit] getAccessToken returned a Promise, but beforeSubscribe must be synchronous. Token will be ignored.")
          } else {
            token = accessToken;
          }
        } else if (accessTokenKey) {
          token = localStorage.getItem(accessTokenKey);
        }

        if (token) {
          // @ts-ignore
          requestInit.headers.append('Authorization', `Bearer ${token}`);
        }

        if (beforeSubscribe) {
          beforeSubscribe(requestInit);
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
    const onUnmount = () => {
      if (enableLogging) {
        console.log('[Transmit] - Closing connection')
      }
      transmit.close()
    }

    if (enableLogging) {
      transmit.on('connected', () => console.log('[SSE] connected'))
      transmit.on('disconnected', () => console.log('[SSE] disconnected'))
      transmit.on('initializing', () => console.log('[SSE] initializing...'))
      transmit.on('reconnecting', () => console.log('[SSE] reconnecting...'))
    }

    // Clean up on unmount
    return () => {
      onUnmount()
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
          void subscription.create()

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