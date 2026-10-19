# Sweet Club — Firebase backend (PREVIEW ONLY)

This folder contains the preview-only Sweet Club client and backend source. Authentication and Firestore rules can run on Firebase's no-cost plan. The privileged callable functions are intentionally **not deployed** because Cloud Functions deployment requires billing approval. Never publish a service-account key, an Admin SDK private key, a payment webhook secret, or an admin credential in this repository.

## Configured preview project

- Firebase project ID: `baked-with-hope-preview`
- Web app ID: `1:866851893544:web:7a9e2cf7ecad71e1dba01d`
- Web app display name: **Baked with Hope Preview**
- Email/password authentication: configured
- Authorized domains: `localhost` and `bargain-depot.github.io`
- Billing: disabled
- Firestore location: pending owner selection; the database and rules are not deployed yet
- Cloud Functions: not deployed
- Administrator claim: not assigned

## Reward rules (approved by Tina)

- Each **verified completed order** earns exactly **one** punch, regardless of the number of treats. Do **not** award a punch merely because a customer presses “Add to bag” or submits an unverified request.
- Each **10 punches** issues one reward for a free **Signature Pack (4 mini cakes)**. Any excess punches carry over. Example: 9 punches + 3 verified prior-card punches = 2 remaining punches and one available reward.
- Tina can transfer existing paper-card punches to a registered account. Every transfer requires a unique ID and an explanation; retries with the same ID do not add punches again.
- A reward can be redeemed once by an authenticated admin.
- Punches are recorded in `punchLedger`; customer balances and rewards are changed **only by trusted Cloud Functions**.

## Firebase setup (Tina should own the project)

1. Sign in to [Firebase Console](https://console.firebase.google.com/) with the account that should own the bakery backend. Create a project such as **Baked with Hope Preview**. Do not use a real production project yet.
2. The preview **Web app** is already registered. Its public browser configuration is in `firebase-config.js`; it is not an Admin SDK private key.
3. Email/password Authentication and the GitHub Pages domain are represented in `firebase.json`. Deploy only the no-cost Auth configuration with `npx -y firebase-tools@latest deploy --only auth` after reviewing it.
4. Create the default Cloud Firestore database only after choosing its permanent location. Use Standard edition and deploy the locked rules in `firestore.rules`; never leave test-mode rules publicly writable.
5. Use the Firebase CLI from a trusted development computer or connected Firebase app. Set the desired project ID; deploy `firestore.rules` and the code in `functions/`. Node 22 functions require the appropriate supported Firebase runtime.
6. Deploying Cloud Functions requires enabling the **Blaze** billing plan. Budget alerts do not guarantee a hard spending cap; review usage and limits in Firebase Console.
7. Grant Tina an `admin: true` **custom auth claim** using a privileged, one-time Admin SDK bootstrap, after independently verifying her account UID. Never allow customers to set their own claims. Refresh Tina’s login token afterward.
8. The preview browser now supports signup, login, logout, password reset, zero-balance profile creation, and customer dashboards. A customer may create only their own zero-balance profile; every later profile mutation is blocked by rules and reserved for the backend.
9. When a trusted ordering/checkout workflow exists, wire its verified **completed** status to `confirmCompletedOrder`. Currently this function is admin-only by design, so Tina can verify an order manually without giving customers the ability to credit themselves.
10. `apps-script/SweetClubSection.html` is a preview-only partial for Tina's existing Apps Script owner dashboard. It requires the custom `admin` claim in the browser and every callable verifies the same claim on the server. It supports exact email/UID lookup, physical-card transfers, completed-order verification, history review, and one-time reward redemption. See `SWEET_CLUB_OWNER_DASHBOARD_INTEGRATION.md` before touching the Apps Script project.

## Assigning the first administrator

Do not run this until Tina has created and verified her Firebase account and the owner has independently confirmed her exact UID. From a trusted environment with Application Default Credentials, run:

```bash
cd functions
node scripts/set-admin-claim.js <CONFIRMED_TINA_UID> CONFIRM_TINA_UID
```

The script preserves existing claims, refuses unverified email accounts, and never stores credentials.

## Server functions

- `ensureProfile` — signed-in customer creates their own empty profile.
- `confirmCompletedOrder` — admin only; uniquely identifies the completed order; creates order + one-punch ledger entry + reward if threshold reached, atomically.
- `importPaperCardPunches` — admin only; auditable transfer from an old punch card; idempotent by transfer ID.
- `redeemSignaturePack` — admin only; one-time redemption.

## Firestore collections

- `profiles/{authUid}` — punches remaining toward next reward, lifetime punches, rewards earned.
- `orders/{uniqueOrderId}` — completed orders with customer UID and confirmation staff UID.
- `punchLedger/{entryId}` — immutable one-punch order entries and verified legacy transfers.
- `rewards/{authUid}_signature_{serial}` — available or redeemed free Signature Pack rewards.

## Verification status

- Pure loyalty tests cover one punch per order, 10-punch reward issuance, carryover, multiple rewards, duplicate order handling, duplicate manual transfer handling, and one-time redemption state.
- Firestore Emulator tests cover zero-balance profile creation, counter mutation denial, account isolation, admin reads, owner-only ledger/reward reads, and denial of all customer ledger writes.
- Live registration/login and callable-function integration remain pending until Firestore is created, rules/Auth are deployed, and billing/function deployment are separately approved.
- The preview order builder does not confirm payment. Punches remain tied to Tina's `confirmCompletedOrder` action.

The production repository and live website are out of scope and must remain unchanged without separate authorization.
