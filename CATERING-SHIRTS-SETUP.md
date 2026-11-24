# Baked with Hope — shirts, catering and pickup-time improvements

## What was added to the website

- T-shirts at **$25**: black/pink, black/white, white/pink, white/black, in XS, Small, Medium, Large and XL. Add one or more shirts to the existing shopping bag, alongside desserts.
- Dedicated **catering.html** form with the 4 mixed packages, 5 mini-cake packages, and 6 cookie bar packages. It collects flavor counts, occasion/theme, contact info, date/time needed, notes and optional delivery requests.
- Catering extras: mixed-package 8x8 cake **+$30**, Tres Leches upgrades at the specified tier prices, Signature Box Bows **+$2 per box**, and individual cake bows at the four specified mixed-package prices.
- Live estimated catering total and **50% deposit** display. Minimum **24 desserts** and **10-day advance notice**.
- **Add More Items** inside normal checkout, without abandoning the shopping bag.
- Bulk multi-click pickup times for regular and UMass Boston calendars once the Apps Script addon is installed.

## Important: activate the backend

The static website code is in GitHub, but the Google Apps Script backend is **not** automatically modified or deployed by a GitHub commit. Until you finish these steps, catering form submission returns an error.

### 1. Add the two Apps Script files

In the existing spreadsheet's **Extensions → Apps Script** editor, choose **+ → Script** twice and paste the complete contents of:

- [CateringAddon.gs](apps-script/CateringAddon.gs) — validates catering requests, recalculates pricing, records them in a new **Catering Requests** sheet, sends owner and customer emails, and supports status updates.
- [AdminEnhancements.gs](apps-script/AdminEnhancements.gs) — keeps your existing owner dashboard, adds catering requests, and lets you tap multiple pickup times then **Add Selected Times** for both pickup calendars.

Do not delete your existing Code.gs or your Sheets data.

### 2. Make two small edits in your existing Code.gs

**Edit A (owner dashboard preview):** In doGet(), find this existing call:

    getSecureAdminHtml_()

Replace only that call with:

    getSecureAdminHtmlEnhanced_()

**Edit B (catering routing):** In doPost(), immediately after:

    const data = JSON.parse(e.postData.contents);

Insert:

    if (String(data.action || "") === "submitCateringRequest") {
      return jsonResponse_(submitCateringRequest_(data));
    }

Keep the existing submitOrder handling below this insertion unchanged.

### 3. Setup and deploy

1. Save all Apps Script files.
2. Select **setupCateringRequests** in the function dropdown and run it **once**. Grant the requested Sheets/Mail permissions in your own Google account.
3. Go to **Deploy → Manage deployments → Edit** (pencil) → choose **New version** → **Deploy**. Updating the existing deployment helps preserve the storefront's configured /exec URL.
4. Open the owner dashboard via the existing admin URL and sign in. Check **Catering Requests** and the multiple-time selector for both calendars.
5. Test one catering inquiry dated at least 10 days ahead. Confirm it creates a row in the new sheet and sends your notifications. The event date is **not automatically confirmed**; do so only after you can accept it.

### 4. Optional owner checks

- Shirts appear as a separate **T-SHIRTS** section in the enhanced dashboard's pickup preparation cards. The original Orders sheet is not migrated or overwritten.
- Shirt orders still follow the existing checkout rule: approved regular/UMass pickup date, payment required in 24 hours, and normal owner processing.
- Catering inquiries are recorded independently of the ordinary weekly order limit. They require your review and a 50% deposit to secure the date. Any delivery fee is quoted separately.
- Individual cake bow prices were supplied only for the four **mixed packages**, so the form does not invent a price for mini-cake-only orders.
- The 8×8 add-on is enabled for the four **mixed catering packages**, matching the placement of the offer in the new price list.
- A customer may choose the number of dessert boxes receiving a Signature Box Bow, at $2 each.
- The catering sheet contains customer contact information; keep access restricted.

## Full code and preview

- [Catering page](catering.html)
- [Storefront](orders.html)
- [Shirt builder code](shop-experience.js)
- [Checkout code](test-checkout.js)
- [Catering backend addon](apps-script/CateringAddon.gs)
- [Owner dashboard addon](apps-script/AdminEnhancements.gs)

The site files were edited in the **Bargain-Depot/bakedwithhope-preview** repository. A CNAME file in that repository references bakedwithhope.com; check which repository GitHub Pages is currently publishing before announcing the changes publicly.
