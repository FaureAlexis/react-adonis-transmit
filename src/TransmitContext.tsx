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
        let token = null
        // Handle authentication through custom function or localStorage
        if (getAccessToken) {
          token = getAccessToken()
        } else if (accessTokenKey) {
          token = localStorage.getItem(accessTokenKey)
        }
        if (token) {
          // @ts-ignore
          requestInit?.headers?.append('Authorization', `Bearer ${token}`)
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

      // Create new subscription if it doesn't exist
      if (!sub) {
        sub = {
          count: 0,
          subscription: transmit.subscription(channel),
        }
        subscriptions.current.set(channel, sub)

        // Set up message handling
        sub.subscription.onMessage((event) => {
          handleMessage(channel, event)
          callback(event)
        })

        // Create the subscription
        ;(async () => {
          try {
            await sub.subscription.create()
          } catch (error) {
            console.error('Failed to create subscription:', error)
          }
        })()
      }

      // Increment reference count
      sub.count++

      // Return cleanup function
      return () => {
        if (!subscriptions.current.has(channel)) return

        const sub = subscriptions.current.get(channel)!
        sub.count--

        // Clean up when no more subscribers
        if (sub.count === 0) {
          sub.subscription.delete()
          subscriptions.current.delete(channel)
        }
      }
    },
    [handleMessage]
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