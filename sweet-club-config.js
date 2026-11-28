/* Launch switch. Keep false until Firebase Auth, Firestore rules, Cloud Functions,
 * owner admin claim, and end-to-end reward tests are confirmed in production.
 * Never put service account keys or private credentials in this file. */
export const sweetClubConfig = Object.freeze({
  enabled: false,
  accountUrl: 'https://bakedwithhope.com/orders.html#sweetClub',
  rewardThreshold: 10
});
