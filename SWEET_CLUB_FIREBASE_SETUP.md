# Sweet Club — Firebase backend (PREVIEW ONLY)

This folder is a **source-code foundation**, not a deployed service. The current GitHub Pages site still uses demo account/reward UI and does not issue real punches. Never publish a service-account key, an Admin SDK private key, a payment webhook secret, or an admin credential in this repository.

## Reward rules (approved by Tina)

- Each **verified completed order** earns exactly **one** punch, regardless of the number of treats. Do **not** award a punch merely because a customer presses “Add to bag” or submits an unverified request.
- Each **10 punches** issues one reward for a free **Signature Pack (4 mini cakes)**. Any excess punches carry over. Example: 9 punches + 3 verified prior-card punches = 2 remaining punches and one available reward.
- Tina can transfer existing paper-card punches to a registered account. Every transfer requires a unique ID and an explanation; retries with the same ID do not add punches again.
- A reward can be redeemed once by an authenticated admin.
- Punches are recorded in `punchLedger`; customer balances and rewards are changed **only by trusted Cloud Functions**.

## Firebase setup (Tina should own the project)

1. Sign in to [Firebase Console](https://console.firebase.google.com/) with the account that should own the bakery backend. Create a project such as **Baked with Hope Preview**. Do not use a real production project yet.
2. Add a **Web app**. Record its public Firebase web configuration (apiKey, authDomain, projectId, appId, etc.). These are browser configuration fields, **not** an Admin SDK private key.
3. Enable **Authentication → Sign-in method → Email/Password**. Add the GitHub Pages domain **bargain-depot.github.io** to Auth authorized domains if needed.
4. Create a **Cloud Firestore** database in a suitable US region. Select production/locked rules; never leave test-mode rules publicly writable.
5. Use the Firebase CLI from a trusted development computer or connected Firebase app. Set the desired project ID; deploy `firestore.rules` and the code in `functions/`. Node 22 functions require the appropriate supported Firebase runtime.
6. Deploying Cloud Functions requires enabling the **Blaze** billing plan. Budget alerts do not guarantee a hard spending cap; review usage and limits in Firebase Console.
7. Grant Tina an `admin: true` **custom auth claim** using a privileged, one-time Admin SDK bootstrap, after independently verifying her account UID. Never allow customers to set their own claims. Refresh Tina’s login token afterward.
8. Only after rules are deployed and tested: connect the browser’s Firebase SDK and replace the *preview* account form with real signup/login; create profiles via `ensureProfile`.
9. When a trusted ordering/checkout workflow exists, wire its verified **completed** status to `confirmCompletedOrder`. Currently this function is admin-only by design, so Tina can verify an order manually without giving customers the ability to credit themselves.
10. Build a restricted Tina dashboard for looking up customer UIDs, adding legacy punches via `importPaperCardPunches`, and redeeming rewards via `redeemSignaturePack`. Never expose admin tools to unprivileged users.

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

**Important:** The backend is not yet deployed or tested against Firebase emulators. Test account isolation, transaction retry/idempotency, concurrent order completions, multi-reward thresholds, and unauthorized function calls before accepting real users. The real live bakery repository must remain unchanged without separate authorization.
