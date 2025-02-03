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
  onMessage,
  authHeader,
  enableLogging = false,
}: TransmitProviderProps) {
  // Create a persistent Transmit instance
  const transmit = useRef<Transmit>(
    new Transmit({
      baseUrl,
      beforeSubscribe: (requestInit) => { 
        if (authHeader) {
          // @ts-ignore
          requestInit.headers.append('Authorization', authHeader);
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
      // transmit.close()
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
  const handleMessage = 
    (channel: string, event: any) => {
      if (enableLogging) {
        console.log(`[Transmit] ${channel} message:`, event)
      }
      onMessage?.(channel, event)
    }

  // Subscribe to a channel with reference counting for cleanup
  const subscribe = useCallback((channel: string, callback: (event: any) => void) => {
    console.log('[Transmit] - Subscribing to', channel)
    let sub = subscriptions.current.get(channel)
    console.log({ sub })
    if (!sub) {
      sub = {
        count: 0,
        subscription: transmit.subscription(channel)
      }
      subscriptions.current.set(channel, sub)
      
      // Setup global listeners
      sub.subscription.onMessage((event) => {
        handleMessage(channel, event)
        callback(event)
      })

      // Await subscription.create
      ;(async () => {
        try {
          await sub.subscription.create()
        } catch (error) {
          console.error('Failed to create subscription:', error)
        }
      })()
    }

    sub.count++
    console.log('[Transmit] - Subscribed to', channel)
    console.log({ sub })
    // Return unsubscribe function
    return () => {
      if (!subscriptions.current.has(channel)) return
      
      const sub = subscriptions.current.get(channel)!
      sub.count--
      
      if (sub.count === 0) {
        sub.subscription.delete()
        subscriptions.current.delete(channel)
      }
    }
  }, [])

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