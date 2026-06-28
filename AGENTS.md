# PEGGASUSD Project Guidelines

## Overview
PEGGASUSD is a Lightning Network wallet for Cuba using the Breez Spark SDK. Supports both SAT and USD (Spark token) balances with built-in conversion.

## Architecture
- **SDK Service**: `lib/sdk_service.dart` - singleton managing BreezSdk lifecycle
- **Screens**: `lib/screens/` - onboard, home, receive, send, history
- **State**: Provider-ready but uses simple setState for MVP

## Key SDK APIs (from examples)
- `BreezSdkSparkLib.init()` - init FFI bridge
- `initLogging()` - get log stream
- `connect(request: ConnectRequest)` - connect with config + seed + storageDir
- `sdk.getInfo(request: GetInfoRequest)` - balance + token balances
- `sdk.addEventListener()` - event stream (Synced, PaymentSucceeded, etc.)
- `sdk.parse(input:)` - parse invoices/addresses/LNURL
- `sdk.prepareSendPayment(request:)` - prepare with PaymentRequest.input()
- `sdk.sendPayment(request:)` - execute with SendPaymentOptions
- `sdk.receivePayment(request:)` - receive with ReceivePaymentMethod
- `sdk.listPayments(request:)` - payment history with filters
- `sdk.getTokensMetadata(request:)` - token info (name, ticker, decimals)
- `sdk.fetchConversionLimits(request:)` - min/max for SAT↔token conversion

## Payment Methods (ReceivePaymentMethod)
- `ReceivePaymentMethod.bolt11Invoice(description, amountSats, expirySecs, paymentHash)` - Lightning invoice
- `ReceivePaymentMethod.sparkAddress()` - Spark address (for SAT)
- `ReceivePaymentMethod.sparkInvoice(description, amount, expiryTime, senderPublicKey, tokenIdentifier)` - Spark invoice (for tokens)

## Send Payment Flow
1. `sdk.parse(input:)` -> `InputType` (Bolt11Invoice, SparkAddress, etc.)
2. `sdk.prepareSendPayment(request:)` -> `PrepareSendPaymentResponse`
3. `sdk.sendPayment(request:)` -> `SendPaymentResponse`

## Token Conversion
- SAT → Token: `ConversionType.fromBitcoin()` + `tokenIdentifier`
- Token → SAT: `ConversionType.toBitcoin(fromTokenIdentifier:)`
- Pass `conversionOptions` to `PrepareSendPaymentRequest`

## Build
- `flutter build apk --target-platform android-arm64 --release`
- minSdk: 24 (required by Spark SDK)
- CI: GitHub Actions workflow at `.github/workflows/build.yml`
