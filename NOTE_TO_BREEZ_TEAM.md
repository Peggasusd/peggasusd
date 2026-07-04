# Note for Breez SDK Team / Nota para el equipo de Breez SDK

---

## English Version

**Subject:** Custom LNURL domain for PEGGASUSD (Capacitor/Android Spark wallet)

Hi Breez team,

We are building PEGGASUSD, a self-custodial Lightning wallet for Cuba using the Spark SDK. The app runs as a Capacitor app on Android and targets users who currently have limited access to global payment infrastructure.

We are interested in setting up a custom Lightning Address domain (e.g., `user@peggasusd.me`) instead of the default `user@breez.tips`. We understand this is supported via the `lnurlDomain` config field in the SDK.

To proceed, we need the following information:

1. **DNS target** — What hostname or IP should we point a CNAME (or A record) to so that Breez's LNURL server handles requests for our domain?
2. **Domain registration/authorization** — Do we need to register the custom domain with Breez/Lightspark? Is there a dashboard, API, or support request process for this?
3. **SSL/TLS requirements** — Does Breez handle SSL termination, or do we need to provide our own certificate?
4. **Any other prerequisites** — Are there any additional steps or limitations we should be aware of?

For context, our current stack:
- SDK: `@breeztech/breez-sdk-spark` (WASM + Capacitor WebView)
- Network: mainnet
- Platform: Android (Capacitor/Cordova)

We already have the `lnurlDomain` field exposed in our Settings UI (currently behind dev mode) and plan to make it generally available once we have the DNS details.

Thank you for your time and for building this SDK — it is making a real difference for users in restricted markets.

Best regards,
The PEGGASUSD team

---

## Versión en Español

**Asunto:** Dominio LNURL personalizado para PEGGASUSD (wallet Spark en Capacitor/Android)

Hola equipo de Breez,

Estamos construyendo PEGGASUSD, una wallet Lightning auto-custodial para Cuba usando el Spark SDK. La app corre como una app Capacitor en Android y está dirigida a usuarios que actualmente tienen acceso limitado a la infraestructura de pagos global.

Nos interesa configurar un dominio personalizado de Lightning Address (ej: `usuario@peggasusd.me`) en lugar del dominio por defecto `usuario@breez.tips`. Entendemos que esto se soporta a través del campo de configuración `lnurlDomain` del SDK.

Para poder proceder, necesitamos la siguiente información:

1. **Destino DNS** — ¿Qué hostname o IP debemos apuntar con un CNAME (o registro A) para que el servidor LNURL de Breez maneje las solicitudes de nuestro dominio?
2. **Registro/autorización del dominio** — ¿Necesitamos registrar el dominio personalizado con Breez/Lightspark? ¿Hay un dashboard, API o proceso de solicitud de soporte para esto?
3. **Requisitos de SSL/TLS** — ¿Breez maneja la terminación SSL, o necesitamos proporcionar nuestro propio certificado?
4. **Otros requisitos** — ¿Hay pasos adicionales o limitaciones que deberíamos tener en cuenta?

Para contexto, nuestro stack actual:
- SDK: `@breeztech/breez-sdk-spark` (WASM + Capacitor WebView)
- Red: mainnet
- Plataforma: Android (Capacitor/Cordova)

Ya tenemos el campo `lnurlDomain` expuesto en nuestra UI de Ajustes (actualmente detrás del modo de desarrollo) y planeamos ponerlo disponible para todos los usuarios una vez que tengamos los detalles de DNS.

Gracias por su tiempo y por construir este SDK — está marcando una diferencia real para usuarios en mercados restringidos.

Saludos cordiales,
El equipo de PEGGASUSD
