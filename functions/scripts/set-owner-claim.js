'use strict';
/**
 * ONE-TIME OWNER SETUP. Run locally or in a secure admin terminal,
 * NEVER in a browser, GitHub Actions log, or customer-facing website.
 *
 * Requirements:
 *   cd functions
 *   npm install
 *   gcloud auth application-default login
 *   GOOGLE_CLOUD_PROJECT=baked-with-hope-preview node scripts/set-owner-claim.js owner@example.com
 *
 * The owner must ALREADY exist in Firebase Authentication and must control the email.
 * The script only grants an admin claim to the specific intended bakery owner email.
 * Never commit credentials or service-account keys to GitHub.
 */
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const projectId=process.env.GOOGLE_CLOUD_PROJECT||'';
const email=(process.argv[2]||'').trim().toLowerCase();
const intended='bakedwithhope.ma@gmail.com';
if(projectId!=='baked-with-hope-preview'||email!==intended){
  console.error('Refusing admin setup: verify the Firebase project and exact owner email.');
  process.exit(1);
}
initializeApp({credential:applicationDefault(),projectId});
(async()=>{
  const auth=getAuth();
  const user=await auth.getUserByEmail(email);
  if(!user.emailVerified)throw new Error('Owner email must be verified before granting admin access.');
  if(user.disabled)throw new Error('Owner account is disabled.');
  await auth.setCustomUserClaims(user.uid,{...(user.customClaims||{}),admin:true});
  console.log('Owner admin permission set for Firebase UID:',user.uid);
  console.log('Sign out and back in to refresh the owner token.');
})().catch(err=>{console.error('Owner setup failed:',err.message);process.exitCode=1;});
