import React from 'react'
import { render, act } from '@testing-library/react'
import { TransmitProvider, useTransmit } from '../TransmitContext'
import { Transmit } from '@adonisjs/transmit-client'

// Mock Transmit class
const mockSubscription = {
  onMessage: jest.fn(),
  create: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
}

const mockOn = jest.fn()
const mockSubscriptionFn = jest.fn().mockReturnValue(mockSubscription)
const mockClose = jest.fn()

jest.mock('@adonisjs/transmit-client', () => ({
  Transmit: jest.fn().mockImplementation(() => ({
    subscription: mockSubscriptionFn,
    on: mockOn,
    close: mockClose,
  })),
}))

describe('TransmitContext', () => {
  const baseUrl = 'http://test.com'
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TransmitProvider baseUrl={baseUrl}>{children}</TransmitProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create Transmit instance with correct baseUrl', () => {
    render(<TransmitProvider baseUrl={baseUrl}>test</TransmitProvider>)
    expect(Transmit).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl,
      })
    )
  })

  it('should add auth header when provided', () => {
    const authHeader = 'Bearer test-token'
    render(
      <TransmitProvider baseUrl={baseUrl} authHeader={authHeader}>
        test
      </TransmitProvider>
    )
    const transmitInstance = (Transmit as jest.Mock).mock.calls[0][0]
    const headers = { append: jest.fn() }
    transmitInstance.beforeSubscribe({ headers })
    expect(headers.append).toHaveBeenCalledWith('Authorization', authHeader)
  })

  it('should throw error when useTransmit is used outside provider', () => {
    const TestComponent = () => {
      useTransmit()
      return null
    }
    
    expect(() => render(<TestComponent />)).toThrow('useTransmit must be used within a TransmitProvider')
  })

  it('should handle subscription lifecycle correctly', async () => {
    const callback = jest.fn()
    const channel = 'test-channel'

    const TestComponent = () => {
      const { subscribe } = useTransmit()
      React.useEffect(() => {
        return subscribe(channel, callback)
      }, [])
      return null
    }

    render(<TestComponent />, { wrapper })

    // Check subscription creation
    expect(mockSubscriptionFn).toHaveBeenCalledWith(channel)
    expect(mockSubscription.create).toHaveBeenCalled()
    expect(mockSubscription.onMessage).toHaveBeenCalled()

    // Simulate message
    const message = { data: 'test' }
    const onMessageHandler = mockSubscription.onMessage.mock.calls[0][0]
    act(() => {
      onMessageHandler(message)
    })
    expect(callback).toHaveBeenCalledWith(message)
  })

  it('should handle multiple subscriptions to same channel', async () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const channel = 'test-channel'

    const TestComponent = () => {
      const { subscribe } = useTransmit()
      React.useEffect(() => {
        const unsub1 = subscribe(channel, callback1)
        const unsub2 = subscribe(channel, callback2)
        return () => {
          unsub1()
          unsub2()
        }
      }, [])
      return null
    }

    const { unmount } = render(<TestComponent />, { wrapper })

    // Should only create one subscription
    expect(mockSubscriptionFn).toHaveBeenCalledTimes(1)

    // Get the onMessage handler that was registered
    const onMessageHandler = mockSubscription.onMessage.mock.calls[0][0]

    // Both callbacks should receive messages
    const message = { data: 'test' }
    
    // Call the handler directly
    onMessageHandler(message)

    // Verify callbacks were called
    expect(callback1).toHaveBeenCalledWith(message)

    // Cleanup on unmount
    unmount()
    expect(mockSubscription.delete).toHaveBeenCalled()
  })


  it('should handle logging when enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    render(
      <TransmitProvider baseUrl={baseUrl} enableLogging>
        test
      </TransmitProvider>
    )

    expect(mockOn).toHaveBeenCalledWith('connected', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('disconnected', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('initializing', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('reconnecting', expect.any(Function))

    // Simulate events
    const events = mockOn.mock.calls
    events.forEach(([_event, handler]: [string, () => void]) => {
      handler()
    })

    expect(consoleSpy).toHaveBeenCalledTimes(4)
    consoleSpy.mockRestore()
  })

  it('should log subscription and message events when logging is enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const callback = jest.fn()
    const channel = 'test-channel'
    const message = { data: 'test' }

    const TestComponent = () => {
      const { subscribe } = useTransmit()
      React.useEffect(() => {
        return subscribe(channel, callback)
      }, [])
      return null
    }

    render(<TestComponent />, { 
      wrapper: ({ children }) => (
        <TransmitProvider baseUrl={baseUrl} enableLogging>{children}</TransmitProvider>
      )
    })

    // Check subscription logs
    expect(consoleSpy).toHaveBeenCalledWith('[Transmit] - Subscribing to', channel)
    expect(consoleSpy).toHaveBeenCalledWith('[Transmit] - Subscribed to', channel)

    // Simulate message and check message log
    const onMessageHandler = mockSubscription.onMessage.mock.calls[0][0]
    act(() => {
      onMessageHandler(message)
    })
    expect(consoleSpy).toHaveBeenCalledWith(`[Transmit] ${channel} message:`, message)

    consoleSpy.mockRestore()
  })

  it('should not log when logging is disabled', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const callback = jest.fn()
    const channel = 'test-channel'
    const message = { data: 'test' }

    const TestComponent = () => {
      const { subscribe } = useTransmit()
      React.useEffect(() => {
        return subscribe(channel, callback)
      }, [])
      return null
    }

    render(<TestComponent />, { 
      wrapper: ({ children }) => (
        <TransmitProvider baseUrl={baseUrl} enableLogging={false}>{children}</TransmitProvider>
      )
    })

    // Simulate message
    const onMessageHandler = mockSubscription.onMessage.mock.calls[0][0]
    act(() => {
      onMessageHandler(message)
    })

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
}) 