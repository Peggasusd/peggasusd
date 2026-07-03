# PEGGASUSD

**PEGGASUSD** is a self-custodial Lightning Network wallet for Cuba, built as a fork of [Glow](https://github.com/breez/glow-web) (Breez's open-source web wallet). It runs as a PWA on Android via Capacitor.

## Key Differences from Glow

| Aspect | Glow | PEGGASUSD |
|--------|------|-----------|
| Seed storage | Passkey-encrypted (WebAuthn) | On-device (localStorage) — no passkey or biometrics required |
| Authentication | Passkey required | PIN code (6 digits) |
| Stable balance | Spark tokens | Spark tokens via Flashnet |
| Cross-chain | — | USDT/USDC send on EVM chains (Flashnet+Boltz) |
| Target audience | Global | Cuba-focused |

## How It Works

### Self-Custody
Your seed phrase is stored **only on your device** in the browser's local storage. There are no passkeys, no biometrics, and no cloud backups. You are in full control of your funds.

### Spark Protocol
All incoming payments are automatically swapped to **Spark tokens**, giving you a unified USD balance:
- **Lightning invoices** → received as Spark (USD)
- **Bitcoin on-chain** → received and auto-swapped to Spark

### USD via Flashnet
The USD stable balance runs on **Flashnet**, a Lightning-based protocol for stablecoin transfers. When you hold Spark tokens, you're holding a USD-pegged asset on Flashnet.

### Cross-Chain USDT/USDC
You can send USDT/USDC to any EVM-compatible chain (Ethereum, BSC, Polygon, etc.) through the **Flashnet+Boltz** bridge. The wallet handles the swap from Spark → on-chain token automatically.

## Features

- Send & receive Lightning payments (Bolt11, Lightning Address, LNURL-Pay)
- Receive Bitcoin on-chain (auto-swapped to Spark)
- Spark USD stable balance via Flashnet
- Send USDT/USDC cross-chain to EVM chains
- QR code scanning for invoices and addresses
- Contact management
- Transaction history with real-time updates
- PIN lock (6 digits)
- English & Spanish interface

## Architecture

```
┌──────────────────────┐
│   React SPA (PWA)    │
│  Vite + TypeScript   │
│  Tailwind CSS        │
├──────────────────────┤
│   Breez SDK (WASM)   │
│   Spark Protocol     │
├──────────────────────┤
│  Capacitor (Android) │
└──────────────────────┘
```

The wallet uses the **Breez SDK** compiled to WebAssembly for all Lightning Network operations. The SDK handles node management, channel operations, payment routing, and the Spark/Flashtnet integration.

## Build

### Prerequisites
- Node.js 22+
- npm

### Setup
```bash
npm install
cp example.env .env.local
# Edit .env.local — add your VITE_BREEZ_API_KEY
```

### Development
```bash
npm run dev
```

### Android APK
```bash
# The CI workflow builds and signs the APK automatically on dispatch.
# Manual build:
flutter build apk --target-platform android-arm64 --release
```

## Security Note

Your recovery phrase is stored in the browser's `localStorage`. While convenient for self-custody, any JavaScript running in the same origin (including XSS attacks or browser extensions) could potentially access it. For larger amounts, consider using additional security measures or a hardware wallet.

## License

Based on Glow by Breez — modified and distributed under the same license terms.
