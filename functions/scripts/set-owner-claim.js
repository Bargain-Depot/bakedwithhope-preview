'use strict';
/**
 * ONE-TIME OWNER SETUP — trusted admin terminal only.
 *
 * Must be run with authenticated Firebase Admin credentials for the bakery's
 * Google Cloud project. Do not use in browser JS or on the public website.
 *
 * From repository's functions/ directory:
 *   GOOGLE_CLOUD_PROJECT=baked-with-hope-preview \
 *     CONFIRM_OWNER_EMAIL="verified-owner@example.com" \
 *     node scripts/set-owner-claim.js "verified-owner@example.com"
 *
 * The target email must be verified and manually confirmed. The caller's
 * Google credentials must be authorized to manage Firebase Auth users.
 * This script does not grant Google Cloud project IAM permissions.
 */
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');

const projectId=(process.env.GOOGLE_CLOUD_PROJECT||'').trim();
const email=(process.argv[2]||'').trim().toLowerCase();
const confirmation=(process.env.CONFIRM_OWNER_EMAIL||'').trim().toLowerCase();

if(projectId!=='baked-with-hope-preview'||
   !email || email.length>254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
   confirmation!==email){
  console.error('Refusing owner setup: verify project ID and explicitly confirm the exact owner email.');
  process.exit(1);
}

initializeApp({credential:applicationDefault(),projectId});
(async()=>{
 const auth=getAuth();
 const user=await auth.getUserByEmail(email);
 if(!user.emailVerified)throw new Error('Owner email must be verified before granting admin access.');
 if(user.disabled)throw new Error('Owner account is disabled.');
 if(user.customClaims?.admin===true){
   console.log('This verified owner account already has the admin permission.');
   return;
 }
 await auth.setCustomUserClaims(user.uid,{...(user.customClaims||{}),admin:true});
 console.log('Sweet Club owner permission granted to the verified account.');
 console.log('Sign out and back in to refresh your Firebase ID token.');
})().catch(err=>{console.error('Owner setup failed:',err.message);process.exitCode=1;});
