# Sweet Club integration for Tina's existing owner dashboard

## What exists today

The production repository's `admin.html` is a gateway to this Apps Script deployment:

`https://script.google.com/macros/s/AKfycbyzHnskl5J9bOdANItTy1B819uoa1zAXd6TgkahTNiAfRC7H8SelhZpZePTeIZIwH6uLA/exec?page=admin`

The deployed Apps Script page contains the actual dashboard. It uses a passphrase, a browser identifier, and a session token stored in `sessionStorage`. Its client calls server functions through `google.script.run`. Existing features include payment and completion status, opening/closing ordering, pickup-date and timeframe management, weekly capacity, UMass pickup settings, and general settings.

The GitHub gateway says Google verifies the owner, but the rendered dashboard currently uses `adminLogin(passphrase, browserId)`. The Apps Script server source is required to assess how that passphrase is stored, hashed, rate-limited, expired, and authorized.

## Reuse plan

Keep the current `admin.html` gateway, Apps Script deployment, owner session, dashboard layout, cards, messages, loading overlay, order boards, calendars, and all current `google.script.run` order-management calls.

Add `apps-script/SweetClubSection.html` as a partial inside the existing `dashboardScreen`, preferably after **Upcoming Pickups**. The section follows the current dashboard's CSS variables and card/button/message patterns. It signs Tina into Firebase separately and checks the Firebase ID token for `admin: true`. Every privileged operation then calls a Firebase callable function that repeats the same custom-claim check server-side.

Firebase remains the system of record for profiles, punch balances, the immutable punch ledger, and rewards. Apps Script remains the system of record for the current order-management workflow.

When an existing order is marked completed, preserve `adminToggleCompleted`. After that operation succeeds, offer an explicit **Award Sweet Club punch** action only when the order is mapped to a registered Firebase UID. Use the existing stable order identifier as `orderId`. Firebase's transaction and ledger ID make retries safe and prevent duplicate punches. If the Apps Script update succeeds but Firebase is temporarily unavailable, show a retryable warning; do not roll back the completed order.

Do not award a punch from the public order form or `doPost`. The trusted trigger remains Tina's verified completion action until a payment provider supplies a trustworthy completed-payment event.

## Source and access needed

To integrate and test without touching production, provide one of these:

1. Editor access to the Apps Script project, with permission to create a separate test deployment; or
2. An export/copy of every `.gs` and `.html` file plus `appsscript.json`, placed in this preview repository.

The minimum source needed is the file containing `doGet`, `adminLogin`, session validation, `getAdminDashboardData`, `adminToggleCompleted`, and the owner dashboard HTML. Include any helper files those functions call.

Testing also needs:

- A copied test spreadsheet or synthetic sheet with the same headers and named ranges as production.
- Script Properties names used by the dashboard, with test-only values. Do not provide the production owner password, live session tokens, service-account keys, or customer records.
- The stable order ID field and the customer email/UID fields returned by `getAdminDashboardData`.
- Permission to create a test Apps Script deployment that executes with the same scopes as production but points only to test data.
- The final sandbox hostname so it can be added to Firebase Auth authorized domains if email/password Auth requires it in the Apps Script iframe.

No Firebase Admin SDK credential belongs in Apps Script or browser code. The browser receives only the public Firebase web configuration and a normal Firebase user token. Tina's UID must be confirmed before the one-time `admin: true` claim is assigned.

## Preview status

`apps-script/SweetClubSection.html` is a preview-only, drop-in partial. It implements exact email/UID search, punch history, physical-card transfer with reason, completed-order verification, and one-time reward redemption against the preview Firebase project. It has not been added to or deployed from the live Apps Script project.
