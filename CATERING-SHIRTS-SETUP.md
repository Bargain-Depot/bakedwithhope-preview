# Baked with Hope — Shirts, Catering & Pickup Times

## Storefront implementation

The GitHub Pages website now contains the requested products, prices and interactions.

### T-shirts — $25 each

- Black shirt + pink writing; black shirt + white writing; white shirt + pink writing; white shirt + black writing
- XS, Small, Medium, Large and XL
- Click a shirt color combination to preview its matching front-and-back design
- **No pickup date for shirt-only orders.** Tina contacts the customer after the shirts arrive, then arranges pickup
- For a mixed shirt-and-dessert bag, the selected date/time applies to the desserts **only**. Shirt pickup is arranged separately
- Shirt-only orders have a separate spreadsheet tab and do **not** use the regular dessert order limit

### Catering

The dedicated [catering page](catering.html) offers the exact mixed, mini-cake-only, and cookie-bar-only packages requested, with their stated tier prices. It allows customers to choose quantities by flavor and enter their occasion/theme, date/time needed, delivery inquiry, notes and contact details.

- **Four mixed packages:** Sweet Gathering $95; The Sweet Affair $140; The Party Edit $180; The Grand Celebration $270, with their respective Tres Leches upgrades ($6, $9, $12, $18), individual bows ($5, $7, $10, $15), and optional 8×8 cake (+$30)
- **Five mini-cake packages:** 24/$100, 36/$150, 48/$195, 60/$240, 72/$285, with Tres Leches upgrades ($12, $18, $24, $30, $36)
- **Individual cake bows for mini-cake-only packages:** 24/+ $10, 36/+ $15, 48/+ $20, 60/+ $25, 72/+ $30
- **Six cookie bar packages:** 24/$85, 36/$120, 48/$155, 60/$185, 72/$215, 96/$280
- **Signature Box Bow:** +$2 per dessert box, with a customer-selected ribbon color
- Standard packaging included, minimum 24 desserts, at least 10 days' notice, and a 50% deposit to secure a confirmed catering order
- Live price estimate and 50% deposit calculation. **An inquiry is not a confirmed booking** and does not collect money on submission
- The optional 8×8 cake add-on is available on the mixed packages

### Cart and owner calendar

- The bag and checkout contain **Add More Items** buttons. They return to the shopping tabs without navigating away or clearing the bag
- The owner dashboard enhancement adds **multi-select pickup times** for both normal pickup and UMass Boston. Tap several times and then click **Add Selected Times**
- The owner dashboard also gets private **Catering Requests** and **T-shirt Orders** panels. The latter tracks arrivals, pickup arrangements and payment status

## Important: activate Google Apps Script separately

GitHub commits **do not** modify Tina's Google Apps Script deployment. The catering and arrival-based T-shirt submission routes will **not work live** until the Apps Script changes below are installed and the existing web app is redeployed.

### Step 1 — Add three files to the existing spreadsheet-bound Apps Script project

In the existing spreadsheet, go to **Extensions → Apps Script**. Add three Script files using **+ → Script**. Copy the full code from:

1. [CateringAddon.gs](apps-script/CateringAddon.gs)
2. [ShirtOrdersAddon.gs](apps-script/ShirtOrdersAddon.gs)
3. [AdminEnhancements.gs](apps-script/AdminEnhancements.gs)

Keep the current `Code.gs` and all existing tabs, data, settings, password hashes and sessions intact. These addon source files are *not* automatically installed by GitHub.

### Step 2 — Make these two tiny edits to Code.gs

**Edit A:** In `doGet(e)`, within the `page === "admin"` branch, change

```js
getSecureAdminHtml_()
```

to

```js
getSecureAdminHtmlEnhanced_()
```

**Edit B:** In `doPost(e)`, immediately after

```js
const data = JSON.parse(e.postData.contents);
```

insert this **before** the existing `submitOrder` action check:

```js
if (String(data.action || "") === "submitCateringRequest") {
  return jsonResponse_(submitCateringRequest_(data));
}
if (String(data.action || "") === "submitShirtOrder") {
  return jsonResponse_(submitShirtOrder_(data));
}
```

Do not remove the existing `submitOrder` branch or its locking and validation.

### Step 3 — Set up and redeploy

Save all files. Run **setupCateringRequests()** and **setupShirtOrders()** once each from the Apps Script function dropdown. Authorize access as the bakery account owner.

Go to **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**. Update the *existing* deployment so its `/exec` URL stays unchanged.

### Step 4 — Verify before announcing the launch

1. Sign into the owner dashboard and confirm both new panels appear.
2. Test a normal pickup day and UMass pickup day using multi-select, then check the stored times.
3. Test a catering inquiry at least 10 days ahead; check the new **Catering Requests** tab and both confirmation emails.
4. Test a shirt-only order; verify it asks for no pickup date, arrives in **Shirt Orders**, sends confirmations, and does not change the dessert capacity.
5. Test a mixed shirt-and-dessert order, and make sure the dessert pickup date is recorded but the shirt pickup note says Tina will contact the customer after arrival.
6. Test the bag **Add More Items** flow on mobile: add an item, close the bag via that button, add another item, and verify both remain in the same bag.

If the browser displays old wording, refresh once and clear its site cache. The orders page asset version numbers have been updated.

## Files

- [Orders/shop page](orders.html)
- [Catering form](catering.html)
- [Ordering builder](shop-experience.js)
- [Checkout](test-checkout.js)
- [Order availability bridge](ordering-availability.js)
- [Catering backend](apps-script/CateringAddon.gs)
- [Shirts backend](apps-script/ShirtOrdersAddon.gs)
- [Dashboard enhancements](apps-script/AdminEnhancements.gs)

**Sweet Club was intentionally left unchanged.**
