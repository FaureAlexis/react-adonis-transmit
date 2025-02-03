# React Adonis Transmit

🚀 Seamless Server-Sent Events integration for React applications using AdonisJS Transmit.

[![npm version](https://badge.fury.io/js/react-adonis-transmit.svg)](https://badge.fury.io/js/react-adonis-transmit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔌 Zero-config setup with AdonisJS Transmit
- 🎯 Simple and intuitive React hooks API
- 🔄 Automatic connection management and reconnection
- 🧮 Smart subscription handling with reference counting
- 🔒 Flexible authentication options
- 📝 Built-in logging for easy debugging
- 📦 Tiny footprint (~3KB gzipped)
- 💪 Written in TypeScript with full type support

## 🚀 Installation

```bash
npm install react-adonis-transmit
```

## 🎯 Quick Start

1. Wrap your app with the TransmitProvider:

```tsx
import { TransmitProvider } from 'react-adonis-transmit'

function App() {
  return (
    <TransmitProvider 
      baseUrl="http://your-api-url"
      // Optional: Handle auth token
      accessTokenKey="access_token"
      // Or use a custom function to get the token
      getAccessToken={() => localStorage.getItem('my_token')}
      // Optional: Handle messages globally
      onMessage={(channel, event) => {
        console.log(`Message from ${channel}:`, event)
      }}
      // Optional: Enable logging
      enableLogging={true}
    >
      {/* Your app components */}
    </TransmitProvider>
  )
}
```

2. Subscribe to channels with our simple hook:

```tsx
import { useTransmit } from 'react-adonis-transmit'

function MyComponent() {
  const { subscribe } = useTransmit()

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribe('my-channel', (event) => {
      console.log('Received event:', event)
    })

    // Auto-cleanup on unmount
    return () => unsubscribe()
  }, [])

  return <div>My Component</div>
}
```

## 🛠 Configuration Options

### TransmitProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `baseUrl` | `string` | **Required.** Base URL of your Adonis API |
| `accessTokenKey` | `string` | Key for auth token in localStorage |
| `getAccessToken` | `() => string \| null \| Promise<string \| null>` | Custom token retrieval function |
| `beforeSubscribe` | `(request) => void \| Promise<void>` | Hook to modify requests before subscription |
| `onMessage` | `(channel, event) => void` | Global message handler |
| `enableLogging` | `boolean` | Enable debug logging |

## 🌟 Why React Adonis Transmit?

- **Simple Integration**: Get real-time updates in your React app with just a few lines of code
- **Smart Memory Management**: Automatic cleanup of unused subscriptions
- **Production Ready**: Built with performance and reliability in mind
- **Developer Friendly**: Comprehensive TypeScript support and debugging tools

## 🤝 Contributing

We welcome contributions! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Improve documentation

## 📝 License

MIT © [Alexis Faure](https://github.com/alexisfaure) 