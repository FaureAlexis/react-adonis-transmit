# React Adonis Transmit

🚀 Seamless Server-Sent Events integration for React applications using AdonisJS Transmit.

[![npm version](https://badge.fury.io/js/react-adonis-transmit.svg)](https://badge.fury.io/js/react-adonis-transmit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Stars](https://img.shields.io/github/stars/FaureAlexis/react-adonis-transmit?style=social) 
![NPM](https://img.shields.io/npm/dt/react-adonis-transmit)
[![CI](https://github.com/FaureAlexis/react-adonis-transmit/actions/workflows/ci.yml/badge.svg)](https://github.com/FaureAlexis/react-adonis-transmit/actions/workflows/ci.yml)


## ✨ Features

- 🔌 Zero-config setup with AdonisJS Transmit
- 🎯 Simple and intuitive React hooks API
- 🔄 Automatic connection management and reconnection
- 🧮 Smart subscription handling with reference counting
- 🔒 Simple authentication handling
- 📝 Built-in logging for easy debugging
- 📦 Tiny footprint (~3KB gzipped)
- 💪 Written in TypeScript with full type support
- 🧪 Thoroughly tested with Jest and React Testing Library

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

1. Make sure you have GitHub CLI installed (`brew install gh` on macOS)
2. Login to GitHub CLI: `gh auth login`
3. Run one of the following commands:
   ```bash
   # Create a custom version release
   npm run release 1.2.3

   # Or use semantic versioning shortcuts
   npm run release:patch  # 0.0.x
   npm run release:minor  # 0.x.0
   npm run release:major  # x.0.0
   ```

The release process will:
- Check for uncommitted changes
- Update version in package.json
- Create and push git tag
- Create GitHub release with auto-generated notes
- Trigger CI/CD pipeline to:
  - Run tests across Node.js 18.x and 20.x
  - Build the package
  - Publish to npm (on release only)

> Note: Make sure you have the `NPM_TOKEN` secret set in your GitHub repository settings for automatic npm publishing.

## 📝 License

MIT © [Alexis Faure](https://github.com/alexisfaure) 

## 🧪 Testing

The library is thoroughly tested using Jest and React Testing Library. Tests cover:

- Provider initialization
- Authentication handling
- Subscription lifecycle
- Multiple subscriptions to the same channel
- Error cases
- Logging functionality

To run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Coverage thresholds are set to 80% for:
- Branches
- Functions
- Lines
- Statements 