# Payment Production Readiness – Audit Summary

## Summary of findings

### Paymob (online payments)
- **Before:** Legacy flow using iframe URL (`PAYMOB_IFRAME_ID`) and same backend (auth, order, payment_keys).
- **After:** Classic iframe flow: backend uses Accept API (auth with `PAYMOB_API_KEY`, order, payment_keys with classic `PAYMOB_INTEGRATION_ID`) then returns redirect to `accept.paymob.com/api/acceptance/iframes/{PAYMOB_IFRAME_ID}?payment_token=...`. Webhook verifies HMAC with `PAYMOB_HMAC_SECRET` and uses idempotency.
- **Frontend:** Uses only the redirect URL from the API; no payment keys on the client. Callback handles success → confirmation, cancel → payment page with `cancelled=1`.

### Bank transfer
- **Before:** Treated as a redirect gateway (placeholder `api.bank-payment-gateway.com`), with `BANK_API_KEY` and `BANK_MERCHANT_ID`.
- **After:** Manual/inbound only. No redirect. Backend uses `BANK_PROFILE_ID`, `BANK_ACCESS_KEY`, `BANK_SECRET_KEY` (backend-only). Optional display vars: `BANK_ACCOUNT_NAME`, `BANK_IBAN`, `BANK_NAME`, `BANK_REFERENCE_FORMAT`. User sees bank account details on the payment page; booking stays `PENDING` until an admin sets payment to PAID. Bank webhook uses `BANK_SECRET_KEY` for signature verification and returns 501 when `BANK_SECRET_KEY` is not set (no real bank API yet).

### Data and architecture
- **Schema:** `payment_method` (PAYMOB | BANK) and `payment_status` (PENDING | PAID | FAILED | REFUNDED) are present and used correctly.
- **Separation:** Paymob and bank logic are in separate modules and routes; no mixing of Paymob keys with bank logic.

---

## List of fixes applied

1. **src/lib/paymob.ts**
   - Implemented classic helper: `createPaymobIframeSession()` using Accept API (auth with `PAYMOB_API_KEY`, order, payment_keys with classic/iframe `PAYMOB_INTEGRATION_ID`), then building iframe URL `accept.paymob.com/api/acceptance/iframes/{PAYMOB_IFRAME_ID}?payment_token=...`. Stores order id in `paymentTransactionId` for webhook.
   - Kept: `verifyPaymobWebhook()` with `PAYMOB_HMAC_SECRET`.

2. **src/app/api/payments/paymob/route.ts**
   - Uses `createPaymobIframeSession()` with booking data; stores `orderId` in `paymentTransactionId`; sets `paymentMethod: "PAYMOB"`; returns `paymentUrl` (iframe URL) only (no keys to frontend).

3. **src/lib/bank-payment.ts**
   - Removed: `createBankPayment`, `verifyBankTransaction`, and any call to external gateway or redirect URLs. Removed `BANK_API_KEY` and `BANK_MERCHANT_ID`.
   - Added: `getBankAccountDetails()` reading from env (`BANK_ACCOUNT_NAME`, `BANK_IBAN`, `BANK_NAME`, `BANK_REFERENCE_FORMAT`).
   - Updated: `verifyBankWebhookSignature()` to use `BANK_SECRET_KEY`.

4. **src/app/api/payments/bank/route.ts**
   - No longer calls `createBankPayment`. Validates booking, sets `paymentMethod: "BANK"`, `paymentStatus: "PENDING"`, `paymentTransactionId: "{bookingId}-bank"`. Returns JSON with `bankDetails` for display; no `paymentUrl`.

5. **src/app/bookings/[id]/payment/page.tsx**
   - Paymob: unchanged flow – POST, get `paymentUrl`, redirect.
   - Bank: POST returns `bankDetails`; UI shows account name, IBAN, bank name, amount, reference with copy buttons; no redirect. Handles `?cancelled=1` from Paymob callback with a toast.

6. **src/app/api/webhooks/bank/route.ts**
   - Returns 501 when `BANK_SECRET_KEY` is not set. Uses `verifyBankWebhookSignature()` from `bank-payment` (with `BANK_SECRET_KEY`).

7. **src/app/admin/settings/page.tsx**
   - Payment gateway section: Paymob – `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`. Also surfaces `PAYMOB_PUBLIC_KEY` and `PAYMOB_SECRET_KEY` as unused (Unified Checkout only). Bank – `BANK_PROFILE_ID`, `BANK_ACCESS_KEY`, `BANK_SECRET_KEY`, and optional display fields.

8. **.env.example**
   - Documented Paymob classic iframe env vars (`PAYMOB_API_KEY`, classic `PAYMOB_INTEGRATION_ID`, `PAYMOB_HMAC_SECRET`, `PAYMOB_IFRAME_ID`). Marked `PAYMOB_PUBLIC_KEY` and `PAYMOB_SECRET_KEY` as unused (Unified Checkout only). Bank transfer env vars unchanged; note to use live HMAC in production.

---

## Risks and recommendations

1. **Paymob classic iframe:** Backend uses Accept API (auth, order, payment_keys with classic `PAYMOB_INTEGRATION_ID`) and redirects to the iframe URL. Webhook payload includes `order.id`; we store it in `paymentTransactionId` for lookup. Ensure `PAYMOB_INTEGRATION_ID` in the dashboard is set to the classic/iframe integration (not Unified Checkout).

2. **Live keys:** Replace any test HMAC/keys with production values before go-live (e.g. `egy_sk_test_*` → live key in `PAYMOB_HMAC_SECRET`).

3. **Receipt upload (optional):** There is no receipt upload for bank transfers yet. If required, add a secure upload (e.g. Cloudinary/S3), validate type/size, store URL on the booking, and restrict access to admin and the booking owner.

4. **Bank webhook:** When a real bank API is available, configure `BANK_SECRET_KEY` and ensure the webhook payload and signature algorithm match `verifyBankWebhookSignature`. Map the bank’s transaction/reference to the booking (e.g. via `paymentTransactionId` or a dedicated field).

---

## Production readiness

- **The system is production-ready** for:
  - **Online payments:** Paymob classic iframe; backend creates sessions with `PAYMOB_API_KEY`/classic `PAYMOB_INTEGRATION_ID`, builds iframe URL with `PAYMOB_IFRAME_ID`; frontend only redirects; webhook verifies HMAC and updates booking.
  - **Bank transfer:** Manual/inbound; display of bank details; bookings stay PENDING until admin confirms; no automatic confirmation unless a verified bank API webhook is configured later.

- **No additional keys are required from the client** beyond those documented in `.env.example` (Paymob: API key, classic/iframe integration ID, iframe ID, HMAC secret; Bank: profile ID, access key, secret key, and optional display fields).
