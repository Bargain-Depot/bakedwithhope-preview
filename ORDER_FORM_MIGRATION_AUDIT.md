# Baked with Hope — Original order form migration audit

Reviewed the live site's source `Bargain-Depot/bakedwithhope/index.html` against `bakedwithhope-preview`. Original site remains unchanged. This is a design/implementation audit, not a claim of production readiness.

## Restored or prototyped in preview
- Original mini cake pack names and listed prices: Single Mini (1/$5.50), Duo Pack (2/$11), Signature Pack (4/$20), Family Pack (6/$29), Sampler Box (8/$38), Celebration Box (12/$54). Original also lists **Build Your Own 8 Pack** separately, not yet independently represented.
- Mini cake Tres Leches upgrades (+$1 per eligible cake); 8×8 upgrade (+$4); Salted Caramel Tres Leches is already Tres Leches and must not receive a duplicate upgrade.
- Mini cake ribbon (+$2) or ribbon + custom card (+$3), with occasion, ribbon color, card color and custom message.
- 8×8 ribbon + custom card (+$2), cake topper (+$2; gold/silver/black), edible glitter spray (+$2; white/gold), and occasion.
- Preview-only regular / UMass Boston pickup selection and payment preference (Venmo, Cash App, Zelle, Cash). No date availability or payment collection is active.
- 6 verified punches → one free Signature Pack coupon to the customer's account, pending secure backend. Existing physical punch cards need a verified migration process; do not credit client-side.

## Remaining work before launch
1. **Owner-controlled availability:** Original form tracks `approvedDates`, `dateTimeframes`, `umassApprovedDates`, `umassDateTimeframes`, `soldOutWeeks`, and `acceptingOrders`. Connect those to the new checkout; never fabricate openings.
2. **Flavor surcharges:** Original defines Cider Donut +$1 per mini cake, Cider Donut 8×8 +$3, and Salted Caramel single +$0.50. The preview still needs accurate handling and review of combined upgrades.
3. **Sampler semantics:** Original has a dedicated Sampler Box with all flavors and a bulk Tres Leches option for 7 eligible cakes; preview currently treats the 8-pack as free-choice. Reconcile 8 vs 9 original flavors and Tina's intended assortment before implementing.
4. **Separate Build Your Own 8 Pack:** Original distinguishes it from Sampler Box; restore as its own choice with the right selection constraints.
5. **Order validation and business rules:** Match the original quantity limits, required card/ribbon choices, owner-approved windows, seasonal products, notes, and sold-out behavior.
6. **Payment/order submission:** Verify original Google Apps Script or migrate to secure backend. Do not enable checkout before end-to-end testing, fraud prevention and confirmation emails.
7. **Accounts and loyalty:** Use authenticated server-side order records and a transaction-safe punch ledger; 6 punches produce one single-use Signature Pack coupon. Design a verified staff-assisted process for importing physical card punches.
8. **Browser QA:** Test desktop and mobile across every category, pack, customization, bag, popup, keyboard interaction, pickup and payment flow. The current preview is not browser-tested end to end.

## Important source differences
- Original mini cake packaging: ribbon +$2, ribbon/card +$3.
- Original 8×8 packaging: ribbon/card +$2; topper +$2; glitter +$2.
- Original 8×8 base $35, Tres Leches +$4, seasonal Cider Donut +$3.
- The old site has distinct campus availability and owner-controlled regular pickup windows.
