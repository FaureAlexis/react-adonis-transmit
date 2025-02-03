# React Adonis Transmit

🚀 Seamless Server-Sent Events integration for React applications using AdonisJS Transmit.

[![npm version](https://badge.fury.io/js/react-adonis-transmit.svg)](https://badge.fury.io/js/react-adonis-transmit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Stars](https://img.shields.io/github/stars/FaureAlexis/react-adonis-transmit?style=social) 
![NPM](https://img.shields.io/npm/dt/react-adonis-transmit)


## ✨ Features

- 🔌 Zero-config setup with AdonisJS Transmit
- 🎯 Simple and intuitive React hooks API
- 🔄 Automatic connection management and reconnection
- 🧮 Smart subscription handling with reference counting
- 🔒 Simple authentication handling
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
      // Optional: Add auth header
      authHeader="Bearer your-token-here"
      // Optional: Handle messages globally
      onMessage={(channel, event) => {
        console.log(`Message from ${channel}:`, event)
      }}
      // Optional: Enable debug logging
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
| `authHeader` | `string` | Authorization header value (e.g. "Bearer token") |
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

## 📦 Release Process

To release a new version:

1. Make your changes and commit them
2. Choose one of the following commands based on the type of release:
   ```bash
   # For a patch release (0.0.x)
   npm run release:patch

   # For a minor release (0.x.0)
   npm run release:minor

   # For a major release (x.0.0)
   npm run release:major
   ```

This will:
- Update the version in package.json
- Create a git tag
- Push changes and tags to GitHub
- Build the package
- Publish to npm

> Note: Make sure you're logged in to npm (`npm login`) and have the necessary permissions before publishing.

## 📝 License

MIT © [Alexis Faure](https://github.com/alexisfaure) 