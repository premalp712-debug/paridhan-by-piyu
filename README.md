# Paridhan by Piyu — Clothing Rentals

Company owner: Priyanshi. The supplied original logo is stored unchanged at `public/assets/paridhan-logo.png` and displayed through a CSS viewport that trims its white margins.

## Rental flow
Customers browse outfits, select sizes, choose pickup and return dates, and submit a rental request. Both dates count as rental days. Requests do not reserve inventory. The date range is limited to 30 days; longer rentals require contacting the business.

No sale price is presented as a rental price. Rental rates and refundable deposits start unset: “Rental quote on request”. Staff can set daily rates/deposits per product or agree a total quote on an individual Requested booking. The server calculates all charges. Legacy sale records are preserved but excluded from rental analytics.

Staff set the agreed quote, then Confirm the booking. Confirmed and Collected rentals occupy capacity until returned/cancelled. Availability is pooled per product; staff must confirm size and fit. Overlapping intervals conservatively count all confirmed pieces, so complex partially overlapping schedules can require manual coordination. Return-day availability remains occupied for that full day. Inventory is reusable and is not permanently decremented as for a sale.

Status transitions: Requested → Confirmed → Collected → Returned; cancellation is allowed before collection. Confirmation rechecks capacity atomically and requires an agreed rental fee and deposit. Refunded amounts, late fees and payment collection are not automated.

## Documents and WhatsApp
A PDF rental request summary is available immediately. After charges are set the same private link shows the rental bill. It is not a payment receipt or a configured GST tax invoice. PDF text uses an ASCII fallback for non-Latin characters.

No WhatsApp API, provider credentials or automatic message delivery. Staff click the WhatsApp button, review the prepared message and bill link, then press Send in WhatsApp. Customer consent controls the sharing button. Bill links grant access to the corresponding document and must be shared privately.

## Access and ownership
Priyanshi is the displayed company owner. Existing platform ownership and login authorization are preserved; no additional person is granted access merely by changing the business owner label.

The configured Site owner is bound to a stable Site user ID after verified sign-in. Only that owner can grant or revoke staff permissions. Manager: products/bookings/analytics. Editor: products/store content. Analyst: aggregate analytics without customer contacts. Every restricted operation checks permissions on the server.

## Current setup
Sample outfits remain for design demonstration and sample mode stays enabled. Upload real clothing photos, enter rental rates and policies, add contact details and address, and archive sample products before enabling live requests. Rates can remain quote-on-request. No online payments are collected. Analytics covers the most recent 2,000 records and excludes refundable deposits and samples.

## Verification
`node scripts/test-commerce.mjs` checks access restrictions, revocation, dates, server pricing, quote-on-request, idempotence, protected PDFs, quote requirements, booking transitions, overlaps, date reuse and cancellation release.
`node node_modules/typescript/bin/tsc --noEmit` checks types. The Sites build helper builds deployment artifacts. Browser visual QA is unavailable in this session.
