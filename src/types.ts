import { Transmit } from '@adonisjs/transmit-client'
import { ReactNode } from 'react'

/**
 * The shape of the context value that will be provided to consumers
 */
export interface TransmitContextValue {
  /** The underlying Transmit instance */
  transmit: Transmit
  /** 
   * Subscribe to a channel and receive events
   * Returns an unsubscribe function that should be called to clean up
   */
  subscribe: (channel: string, callback: (event: any) => void) => () => void
}

/**
 * The shape of the request object passed to beforeSubscribe
 */
export interface TransmitRequest {
  /** Headers to be sent with the SSE request */
  headers?: HeadersInit
}

/**
 * Props for the TransmitProvider component
 */
export interface TransmitProviderProps {
  children: ReactNode
  /** Base URL of your Adonis API */
  baseUrl: string
  /** Enable debug logging */
  enableLogging?: boolean
  /** Called before each subscription request is made */
  beforeSubscribe?: (request: TransmitRequest) => void | Promise<void>
  /** Global handler for all messages */
  onMessage?: (channel: string, event: any) => void
  /** Key used to get the auth token from localStorage */
  accessTokenKey?: string
  /** Custom function to get the auth token */
  getAccessToken?: () => string | null | Promise<string | null>
} 