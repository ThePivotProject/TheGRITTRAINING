# GRIT Payments — PayPal + Stripe Payment Links

## The short answer
Yes. The app now has a real payment option, and you do NOT type card numbers
into the app, store cards, or deal with PCI compliance. The app just shows
buttons. Tapping one opens PayPal / Stripe's own secure checkout page, the
parent pays there, and the money lands in your account.

## What families see
Formats | Payment → "Pay for GRIT" card:
- "Pay with PayPal / Card →" — opens your PayPal Payment Link (PayPal account
  OR card, no PayPal account needed for card)
- "Pay with Card (Stripe) →" — opens your Stripe Payment Link (card, Apple Pay,
  Google Pay)
- If you haven't pasted a link yet, no button shows — nothing can be charged
  by mistake.

## What you do (one time, ~10 min)
### PayPal (recommended first — you already use PayPal)
1. Log into paypal.com (business account) → Send & Request → Payment Links
   → Create Payment Link.
2. Set an amount (e.g. one GRIT session / monthly) or choose "Let customers
   set the price" if amounts vary. Add "Athlete name" as a note field if offered.
3. Copy the link. It looks like https://www.paypal.com/ncp/payment/XXXX
   (You already have a PayPal QR code link on your calendar events — a Payment
   Link is the same idea, but it opens a checkout page instead of a QR.)
4. In the app: Coaches → Payment Links → paste into "PayPal Payment Link"
   → Save. Done — it shows on every phone immediately, no redeploy.

### Stripe (best pure-card checkout)
1. dashboard.stripe.com → Payment Links → Create payment link.
2. Add a product/price (e.g. "GRIT Session — $XX"), turn on card + Apple Pay /
   Google Pay. Copy the link (https://buy.stripe.com/…).
3. In the app: Coaches → Payment Links → paste into "Stripe Payment Link"
   → Save.

## Fees (US, published rates — check your account, they can vary)
- PayPal Payment Link / Goods & Services: about 2.99% per payment.
  PayPal Checkout (branded buttons): about 3.49% + $0.49.
  Example: a $100 payment → you keep about $97.01 on a Payment Link.
- Stripe Payment Link: 2.9% + $0.30 per successful card payment.
  Example: $100 → you keep about $96.80.
- No monthly fee for either one. You only pay when someone actually pays.
- Your existing PayPal QR code on calendar events is a separate, also-valid
  way to get paid — keep it. The in-app link is just easier for families to find.

## Where the links live
In Supabase, collection `grit_settings` (same place as your Supabase URL, calendar
settings, etc.). Change them in Coaches → Payment Links any time. No redeploy,
no Vercel env change, no code change.

## What this does NOT do (on purpose)
- No card numbers in the app. Ever. No card form, no storage, no PCI scope.
- No automatic "paid / not paid" marking in the app. PayPal/Stripe email you
  a receipt for each payment; you mark attendance/payment in the app the way
  you do now. (A webhook that auto-marks paid is possible later — it needs a
  Supabase Edge Function + a Stripe/PayPal webhook secret. Say the word if you
  want that next.)
- No subscriptions in this version. If you want monthly auto-billing, Stripe
  Payment Links support recurring prices — set the price to "Recurring /
  Monthly" when you create the link and it just works through the same button.
