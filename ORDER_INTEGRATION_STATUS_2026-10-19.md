# Baked with Hope — order integration status (preview only)
Updated October 19, 2026.

## Already wired
- `orders.html` now loads `ordering-availability.js` after the product builder.
- Availability is retrieved **read-only** from the existing Apps Script endpoint with `GET ?action=orderingState`.
- When `acceptingOrders` is false **for any reason**, every product card is labeled **SOLD OUT ♡**; the heading shows `Sold Out ♡`.
- Tina's existing editable `Settings` closed message (`statusMessage`) appears above the shop. The text is escaped by using `textContent`, never inserted as HTML.
- When data cannot be fetched, ordering fails closed.
- Approved regular/UMass pickup dates and timeframes are exposed read-only at `window.bwhOrderAvailability` for later checkout integration.
- The home page no longer flashes old fallback cake photos before hero videos load; slide layout is stabilized.
- Builder product photos use centered `object-fit: contain` styling.

## **Not finished — must not claim orders can be submitted**
The checkout button and pickup calendar are still disabled. **No POST / real order submissions have been enabled or tested.**
The existing production Apps Script `doPost` accepts a JSON `submitOrder` object with:
`name`, `phone`, `email`, `box`, `flavor`, `quantity`, `total`, `payment`, `pickupDate`, `pickupTimeframe`, `policyAccepted:true`, `notes` and optional `customPackaging`, `orderType`.
It validates approved pickup date/time, ordering open and weekly limit; it then appends a Google Sheets row and emails both sides.

**Before enabling live submissions:**
1. Obtain a **separate test deployment and test sheet**, not the existing live endpoint, to avoid accidental real orders.
2. Map all bag items (mini cakes, 8×8, bars, bundles, sodas), flavors, individual Tres Leches quantities, selected extras and prices into the existing sheet's columns without losing data; confirm Apps Script notification and dashboard categorization supports these product types.
3. Implement checkout customer details, regular vs UMass location, *only* Tina-approved dates/timeframes, and order policy acceptance. Preserve the original owner limits.
4. Validate totals and required options on the server, not just in the browser; guard against accidental duplicate submissions.
5. Test complete transaction including owner dashboard, sheet row, and confirmation emails with explicit authorization in test deployment.
6. Then request explicit approval to enable real submissions and later DNS cutover.

No production repository, Google Apps Script, Sheets, Firebase billing, or domain settings were changed.
