# PEGGASUSD

**PEGGASUSD** is a self-custodial Lightning Network wallet built with the [Spark SDK](https://sdk-doc-spark.breez.technology/). It runs as a PWA on Android via Capacitor and is based on [Glow](https://github.com/breez/glow-web), Breez's open-source web wallet.

## Accounts

The wallet manages two balances:

- **SAT account** — your Bitcoin balance on the Lightning Network. Used for sending and receiving Lightning payments (Bolt11, Lightning Address, LNURL-Pay) and Bitcoin on-chain transactions.
- **USD account** — a stable balance denominated in USD via Spark tokens on Flashnet. When stable balance is active, incoming sats are automatically converted to the USD equivalent using Flashnet's token conversion. On send, the SDK converts USD back to sats as needed.

Spark tokens can be sent and received directly via Spark addresses, providing instant, feeless transfers between Spark wallets.

## Cross-Chain USDT/USDC

You can send USDT/USDC to any EVM-compatible chain (Ethereum, BSC, Polygon, Arbitrum, Optimism, and 30+ others) directly from your PEGGASUSD balance. The SDK routes the payment through **Flashnet** (AMM) and **Boltz** (cross-chain swap), converting your Spark balance to the destination stablecoin on the target chain automatically. This is a send-only feature — receiving stablecoins from external chains is planned for a future SDK release.

## How It Works

### Self-Custody
Your seed phrase is stored **only on your device** in the browser's local storage. There are no passkeys, no biometrics, and no cloud backups. Access is protected by a 6-digit PIN.

### Payments
- **Send**: Lightning, Lightning Address, LNURL-Pay, Bolt11 invoices, Spark address, Bitcoin on-chain address
- **Receive**: Lightning invoice, Lightning Address, LNURL-Pay, Spark address, Bitcoin on-chain address (auto-swapped to Spark)
- **Cross-chain send**: USDT/USDC to 30+ EVM chains via Flashnet+Boltz

### Spark Protocol
Spark is a Bitcoin-native Layer 2 built by Lightspark, providing instant settlement and multi-asset support. The SDK runs as WebAssembly in the browser, handling all Lightning and Spark operations without requiring a remote node.

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

## Build

### Prerequisites
- Node.js 22+
- npm

### Setup
```bash
npm install
cp example.env .env.local
# Edit .env.local with your VITE_BREEZ_API_KEY
```

### Development
```bash
npm run dev
```

### Android APK
```bash
# CI builds via GitHub Actions (workflow_dispatch).
# Manual build:
npx cap add android && npx cap sync android
# Then open android/ in Android Studio or use:
cd android && ./gradlew assembleRelease
```

## Security Note

Your recovery phrase is stored in `localStorage`. Any JavaScript running in the same origin (XSS attacks, malicious browser extensions) could potentially access it. For larger amounts, consider additional security measures.

## License

Based on Glow by Breez — modified and distributed under the same terms.
