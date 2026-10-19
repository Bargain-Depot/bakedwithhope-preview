'use strict';

const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');

const uid=process.argv[2];
const confirmation=process.argv[3];
if(!uid||confirmation!=='CONFIRM_TINA_UID'){
  console.error('Usage: node scripts/set-admin-claim.js <confirmed-tina-uid> CONFIRM_TINA_UID');
  process.exit(1);
}

initializeApp();
(async()=>{
  const auth=getAuth();
  const user=await auth.getUser(uid);
  if(!user.emailVerified)throw new Error('Refusing admin assignment until Tina\'s email is verified.');
  await auth.setCustomUserClaims(uid,{...(user.customClaims||{}),admin:true});
  console.log(`Admin claim assigned to confirmed UID ${uid} (${user.email||'no email'}).`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
