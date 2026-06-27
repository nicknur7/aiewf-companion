# Security posture

This is a **static, no-backend** SPA. No server, no database, no user accounts, no secrets. All data is the conference's own public JSON; the only state is a list of saved session IDs in `localStorage`.

## Reviewed + hardened (2026-06-27)

- **No XSS surface.** No `dangerouslySetInnerHTML` / `innerHTML` / `eval` in app code. All conference data is rendered through React's auto-escaping JSX.
- **URL scheme validation.** Every data-driven link (`speaker.linkedin`, `sideEvent.href`) is passed through `safeUrl()` which only permits `http(s):`/`mailto:` — blocks `javascript:`/`data:` URI injection if the upstream feed were ever poisoned. Speaker images go through `safePhoto()` (path/https validation).
- **External links** use `rel="noopener noreferrer"`; images use `referrerPolicy="no-referrer"`.
- **Content Security Policy** (`index.html` meta + `public/_headers`): `default-src 'self'`, scripts limited to self + `wasm-unsafe-eval` (required for WASM) + `blob:` workers, `connect-src` limited to self + HuggingFace (model weights), `img-src` self + data + ai.engineer, `frame-ancestors 'none'` (anti-clickjacking, via `_headers`).
- **Self-hosted ML runtime.** The ONNX WASM runtime is served from our own origin (`public/ort-wasm*.wasm`), not a third-party CDN — so no third party serves *executable* code to users. Runs single-threaded (no COOP/COEP needed).
- **ICS export** strips `\r\n,;` from all fields (no calendar-property injection).
- **No secrets** committed or shipped (the semantic model is client-side; no API keys).

## Dependencies

- **`npm audit`: 0 vulnerabilities.** Migrated off `@xenova/transformers` to the maintained **`@huggingface/transformers` v3** (newer onnxruntime), which clears the prior transitive `protobufjs` advisories.

## Known / accepted

- **Model weights** are fetched from the HuggingFace CDN at runtime (data, not code). Standard for client-side ML; allowed in CSP `connect-src`. The executable ONNX **runtime** is self-hosted (not from a CDN).

## Host headers
`public/_headers` (Netlify/Cloudflare Pages format) sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`. GitHub Pages ignores `_headers` (no custom headers) — so prefer Netlify/Cloudflare for the strongest posture.
