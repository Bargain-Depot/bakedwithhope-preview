# Sweet Club — safe launch checklist

This repository contains the Baked with Hope Sweet Club customer portal and the
Firebase backend. The public checkout remains managed by Google Apps Script.

## Current rollout state

The frontend loader is installed, but **registration remains OFF** in
`sweet-club-config.js` (`enabled: false`). This is intentional until the
Firebase project is configured and security tested. No customers should be
invited to sign up before the steps below are complete.

## Prerequisites

- Access to the Firebase project **baked-with-hope-preview** as the legitimate owner.
- A Firebase **Blaze** plan/billing account for the Cloud Functions backend.
  Configure Google Cloud budget alerts.
- Node.js 22 and an up-to-date Firebase CLI.
- Owner approval of the policy: **one punch per verified completed order**;
  ten punches yield one free **Signature Pack (four mini cakes)**. Paper-card
  transfer is an owner-reviewed, one-time action.

## 1. Deploy the protected backend

Open a trusted terminal in this GitHub repository root:

```bash
npm install --global firebase-tools
firebase login
npm --prefix functions ci
npm --prefix functions test
npm --prefix functions run lint
firebase deploy --project baked-with-hope-preview --only auth,firestore:rules,functions
```

Firestore rules prevent customer-side edits to punch balances, reward records,
and the ledger. The callable Cloud Functions use a Firebase **admin** custom
claim for order completion, transfers, reward redemption, and customer search.

Make sure the default Firestore database exists in the Firebase Console.
For local Firestore security rule tests run:

```bash
cd functions
npm run test:rules
```

If deployment fails, **do not** turn on Sweet Club registration.

## 2. Configure sign-in and email links

In the Firebase Console > Authentication:

1. Enable **Email/Password** sign-in if it is not already enabled.
2. Under Settings > Authorized domains, allow **bakedwithhope.com**
   (and `www.bakedwithhope.com` if that hostname actually serves the site).
   The `authorizedDomains` metadata in firebase.json is not proof that the
   setting was applied; verify it in the console.
3. Confirm Email Verification and Password Reset email templates.
4. Test that verification/reset links return to
   `https://bakedwithhope.com/orders.html#sweetClub`.

Do not share or commit service-account credentials or passwords.

## 3. Set up the one authorized bakery owner

Create the account for `bakedwithhope.ma@gmail.com` in Firebase
Authentication. Verify ownership of that inbox and mark the email
**verified** before granting privileges.

On a trusted owner-admin machine with Google Cloud CLI available:

```bash
cd functions
gcloud auth application-default login
GOOGLE_CLOUD_PROJECT=baked-with-hope-preview node scripts/set-owner-claim.js bakedwithhope.ma@gmail.com
```

The account running the script needs permission to manage Firebase
Authentication users. The script explicitly refuses other project IDs/emails.

Sign out and sign back in. Visit `sweet-club-owner.html`; only an account with
the privileged claim can use the owner tools.

## 4. Test the actual rewards flow before exposing signup

Use test customers and separate, unique test order IDs. Confirm:

- A new **verified** member starts at 0/10; email verification is mandatory.
- An unverified or logged-out customer cannot read or change reward records.
- Tina sees a customer by exact email in the protected owner interface.
- One completed order gives **one** punch; retrying its ID does not double-credit.
- At 10 punches, the card returns to 0/10 and **one free Signature Pack reward**
  appears. A 12th lifetime punch means 2/10 on the next card.
- Transferring paper-card punches keeps the correct carryover; a retry with the
  same transfer ID never gives extra punches.
- Only Tina can mark rewards redeemed; a second redemption does not duplicate.
- Try accessing another customer's Firestore records as a normal customer:
  access must be denied.

Owner punch award is **manual for now**. Tina must confirm a completed order in
the Orders spreadsheet or confirmation email before crediting it through the
owner tool. Sending an order from checkout or merely marking it paid does not
automatically grant a punch. The owner tool does not schedule the free pickup.

## 5. Launch Sweet Club

Only after all above steps pass:

1. Change `enabled: false` to `enabled: true` in
   `sweet-club-config.js` in the website GitHub repository.
2. Commit and publish to the existing GitHub Pages site/custom domain.
3. Test account creation, verification, login, reset, balance, owner credit and
   redemption on the **actual** `bakedwithhope.com` domain.
4. Announce Sweet Club to customers.

For emergencies, change `enabled` back to `false`. This hides the public
account UI; existing Firebase accounts/records remain intact.

## Architecture

- `orders.html` → `sweet-club-loader.js` (feature switch)
- `rewards-preview.js` → Firebase Auth / Firestore (customer portal)
- `sweet-club-owner.html` → Firebase Auth / protected callable Functions (staff)
- `functions/index.js` + `functions/loyalty.js` → trusted reward transactions
- `firestore.rules` → customer isolation and read-only punch balances
- `functions/scripts/set-owner-claim.js` → one-time private owner setup

The Firebase project ID currently includes the word "preview", but it is the
configured project for the existing storefront. Confirm this is the intended
production customer-data project before accepting real member registrations.
