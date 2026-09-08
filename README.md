# eSIM Order Automation PoC

Minimal Next.js App Router proof of concept for a travel eSIM order automation demo.

## Project Structure

```text
app/
  api/orders/route.js
  globals.css
  layout.js
  page.js
.env.example
.gitignore
next.config.js
package.json
postcss.config.js
tailwind.config.js
```

## Environment Variables

```bash
N8N_WEBHOOK_URL=https://shivam-asp.app.n8n.cloud/webhook/esim-order
N8N_HMAC_SECRET=replace-with-a-long-random-secret
```

`N8N_HMAC_SECRET` is read only by the server-side API route. Do not prefix it with `NEXT_PUBLIC_`.

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## n8n Workflow Configuration

Workflow shape:

```text
Webhook
Verify HMAC Signature
Validate Request
Check Duplicate Order ID
Generate Mock eSIM Data
Respond to Webhook
```

Webhook node:

- Method: `POST`
- Path: `esim-order`
- Response mode: use a final `Respond to Webhook` node

Verify HMAC Signature node:

- Use a Code node.
- Read the request body from the Webhook node.
- Recreate the signed payload with `JSON.stringify` and this exact key order: `customerName`, `email`, `orderId`, `country`, `package`.
- Compute HMAC-SHA256 over that payload with the same secret stored in n8n.
- Compare with request header `x-esim-signature`.
- Expected header format: raw hex digest.
- Reject with HTTP `401` if the signature does not match.
- Do not print or expose the real HMAC secret. In n8n, keep the secret in a secure workflow variable, credential, or environment-backed value if available.

Validation node:

- Require `customerName`, `email`, `orderId`, `country`, and `package`.
- Reject with HTTP `400` if any required field is missing or blank.

Duplicate Order ID node:

- For this PoC, use workflow static data or another temporary n8n-local memory mechanism to store processed order IDs.
- This is demo-only duplicate handling, not production-safe.
- If an `orderId` already exists, return HTTP `409` with a clear duplicate-order message.

Mock eSIM response node:

Return a payload like:

```json
{
  "orderId": "ORD-1001",
  "status": "provisioned",
  "iccid": "8996501234567890123",
  "activationCode": "LPA:1$demo-esim.local$ABC123XYZ",
  "package": "USA 10GB",
  "message": "eSIM provisioned successfully"
}
```

## Vercel Deployment

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Add `N8N_WEBHOOK_URL` and `N8N_HMAC_SECRET` in Vercel Project Settings.
4. Deploy.
5. Use an HTTPS n8n webhook URL for the deployed app.

## End-to-End Test Steps

1. Start the Next.js app with `npm run dev`.
2. Configure `.env.local` with the n8n webhook URL and HMAC secret.
3. Submit a complete order from the UI.
4. Confirm n8n receives JSON fields in deterministic key order.
5. Confirm n8n verifies `x-esim-signature`.
6. Confirm a successful response is displayed in the UI.
7. Submit the same `Order ID` again.
8. Confirm n8n returns a duplicate response and the UI shows the error.
9. Stop or misconfigure n8n and confirm the UI shows a clean unavailable message.

## Known PoC Limitations

- Duplicate order tracking is demo-only when implemented with n8n static data or in-memory state.
- No real payment gateway is implemented.
- No real eSIM provider is integrated.
- No database, authentication, rate limiting, or audit logging is included.
- Validation is intentionally minimal.

## Production Improvements

- Store orders and idempotency keys in a durable database.
- Use constant-time signature comparison in n8n.
- Add request timestamps and replay protection.
- Add structured logging without secrets.
- Add authentication or origin controls for admin-facing workflows.
- Add rate limiting and monitoring.
- Replace mock provisioning with a real provider integration.
