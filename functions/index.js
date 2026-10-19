'use strict';

/**
 * Sweet Club backend — deploy to the Firebase project owned by Tina.
 *
 * SECURITY: No customer-controlled callable is allowed to credit punches.
 * The confirmCompletedOrder callable is STAFF-ONLY for now. When payment/order processing
 * is connected, it must invoke the same transaction only after trusted payment
 * or pickup verification, never directly from a public checkout button.
 */
const {initializeApp}=require('firebase-admin/app');
const {getFirestore, FieldValue}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {onCall, HttpsError}=require('firebase-functions/v2/https');
const {REWARD_THRESHOLD,calculateGrant,completedOrderState,transferState,redemptionState}=require('./loyalty');

initializeApp();
const db=getFirestore();
const REGION='us-east1';
const options={region:REGION, enforceAppCheck:false, maxInstances:10};

function authenticated(request){
  if(!request.auth?.uid)throw new HttpsError('unauthenticated','Please sign in.');
  return request.auth.uid;
}
function admin(request){
  const uid=authenticated(request);
  if(request.auth.token.admin!==true)throw new HttpsError('permission-denied','Tina/admin access only.');
  return uid;
}
function text(value,label,max=200){
  if(typeof value!=='string'||!value.trim()||value.length>max)throw new HttpsError('invalid-argument',label+' is required.');
  const cleaned=value.trim();
  if(label.includes('ID') && (cleaned.includes('/')||cleaned==='.'||cleaned==='..'))throw new HttpsError('invalid-argument','Invalid document identifier.');
  return cleaned;
}
function count(value){
  if(!Number.isSafeInteger(value)||value<1||value>100)throw new HttpsError('invalid-argument','Transfer must be between 1 and 100 punches.');
  return value;
}
function profileDefaults(user){
  return {
    uid:user.uid,
    email:user.email||'',
    displayName:user.displayName||'',
    punches:0,
    lifetimePunches:0,
    rewardsEarned:0,
    createdAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp()
  };
}
function grantTransaction(tx,profileRef,profileSnapshot,amount,metadata){
  const p=profileSnapshot.exists?profileSnapshot.data():{punches:0,lifetimePunches:0,rewardsEarned:0};
  let grant;
  try{grant=calculateGrant(p,amount);}catch{throw new HttpsError('data-loss','Invalid counters in customer profile.');}
  const earned=p.rewardsEarned;
  const patch={
    uid:profileRef.id,punches:grant.punches,lifetimePunches:grant.lifetimePunches,
    rewardsEarned:grant.rewardsEarned,updatedAt:FieldValue.serverTimestamp()
  };
  if(!profileSnapshot.exists)patch.createdAt=FieldValue.serverTimestamp();
  tx.set(profileRef,patch,{merge:true});
  for(let i=1;i<=grant.rewardsIssued;i++){
    const serial=earned+i;
    // Predictable id makes retries safer; no client can write this collection.
    const rewardRef=db.doc('rewards/'+profileRef.id+'_signature_'+serial);
    tx.create(rewardRef,{
      customerId:profileRef.id,kind:'signature_pack_4',punchesUsed:REWARD_THRESHOLD,
      status:'available',serial,source:metadata,
      createdAt:FieldValue.serverTimestamp(),redeemedAt:null,redeemedBy:null
    });
  }
  return {punches:grant.punches,rewardsIssued:grant.rewardsIssued};
}

/** Any signed-in customer can create their own empty profile, never punch credits. */
exports.ensureProfile=onCall(options,async(request)=>{
  const uid=authenticated(request);
  const user=await getAuth().getUser(uid);
  const ref=db.doc('profiles/'+uid);
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists)tx.create(ref,profileDefaults(user));
  });
  return {success:true};
});

/** Admin-only exact customer lookup by email address or Firebase Auth UID. */
exports.searchCustomer=onCall(options,async(request)=>{
  admin(request);
  const query=text(request.data?.query,'Search query',254);
  let user;
  try{
    user=query.includes('@')?await getAuth().getUserByEmail(query.toLowerCase()):await getAuth().getUser(query);
  }catch(error){
    if(error?.code==='auth/user-not-found')throw new HttpsError('not-found','Customer account not found.');
    throw error;
  }
  if(user.disabled)throw new HttpsError('failed-precondition','Customer account is disabled.');
  const profile=await db.doc('profiles/'+user.uid).get();
  return {
    uid:user.uid,
    email:user.email||'',
    displayName:user.displayName||'',
    createdAt:user.metadata.creationTime||null,
    profile:profile.exists?profile.data():null
  };
});

/** Staff confirms *one actually completed* order; idempotent by orderId. */
exports.confirmCompletedOrder=onCall(options,async(request)=>{
  const staffId=admin(request);
  const customerId=text(request.data?.customerId,'Customer ID',128);
  const orderId=text(request.data?.orderId,'Unique order ID',128);
  // Verify customer account exists before using its uid.
  try{await getAuth().getUser(customerId)}catch{throw new HttpsError('not-found','Customer account not found.')}
  const orderRef=db.doc('orders/'+orderId);
  const ledgerRef=db.doc('punchLedger/order_'+orderId);
  const profileRef=db.doc('profiles/'+customerId);
  return db.runTransaction(async tx=>{
    const [existing,entry,profile]=await Promise.all([tx.get(orderRef),tx.get(ledgerRef),tx.get(profileRef)]);
    const state=completedOrderState(existing.exists?existing.data():null,entry.exists?entry.data():null,customerId,orderId);
    if(state==='incomplete')throw new HttpsError('data-loss','Order records are incomplete; no punch was awarded.');
    if(state==='conflict')throw new HttpsError('already-exists','Order ID is already associated with different details.');
    if(state==='processed')return {success:true,alreadyProcessed:true};
    const result=grantTransaction(tx,profileRef,profile,1,{type:'completed_order',orderId});
    tx.create(orderRef,{customerId,status:'completed',punchAwarded:true,completedBy:staffId,completedAt:FieldValue.serverTimestamp()});
    tx.create(ledgerRef,{customerId,delta:1,type:'completed_order',orderId,createdBy:staffId,createdAt:FieldValue.serverTimestamp()});
    return {success:true,alreadyProcessed:false,...result};
  });
});

/** Tina can transfer points from an existing physical punch card, with an audit trail.
 * A unique transferId is required so retrying the same request won't double credit.
 */
exports.importPaperCardPunches=onCall(options,async(request)=>{
  const staffId=admin(request);
  const customerId=text(request.data?.customerId,'Customer ID',128);
  const transferId=text(request.data?.transferId,'Transfer ID',128);
  const reason=text(request.data?.reason,'Transfer explanation',500);
  const amount=count(request.data?.punches);
  try{await getAuth().getUser(customerId)}catch{throw new HttpsError('not-found','Customer account not found.')}
  const ledgerRef=db.doc('punchLedger/legacy_'+transferId);
  const profileRef=db.doc('profiles/'+customerId);
  return db.runTransaction(async tx=>{
    const [existing,profile]=await Promise.all([tx.get(ledgerRef),tx.get(profileRef)]);
    const state=transferState(existing.exists?existing.data():null,customerId,amount,reason);
    if(state==='conflict')throw new HttpsError('already-exists','Transfer ID already used with different details.');
    if(state==='processed')return {success:true,alreadyProcessed:true};
    const result=grantTransaction(tx,profileRef,profile,amount,{type:'legacy_transfer',transferId});
    tx.create(ledgerRef,{customerId,delta:amount,type:'legacy_transfer',transferId,reason,createdBy:staffId,createdAt:FieldValue.serverTimestamp()});
    return {success:true,alreadyProcessed:false,...result};
  });
});

/** Only Tina/staff can mark a reward as redeemed. */
exports.redeemSignaturePack=onCall(options,async(request)=>{
  const staffId=admin(request);
  const rewardId=text(request.data?.rewardId,'Reward ID',220);
  const rewardRef=db.doc('rewards/'+rewardId);
  return db.runTransaction(async tx=>{
    const snapshot=await tx.get(rewardRef);
    const state=redemptionState(snapshot.exists?snapshot.data():null);
    if(state==='missing')throw new HttpsError('not-found','Reward not found.');
    if(state==='unsupported')throw new HttpsError('invalid-argument','Unsupported reward type.');
    if(state==='redeemed')return {success:true,alreadyRedeemed:true};
    if(state==='unavailable')throw new HttpsError('failed-precondition','Reward is not available.');
    tx.update(rewardRef,{status:'redeemed',redeemedBy:staffId,redeemedAt:FieldValue.serverTimestamp()});
    return {success:true,alreadyRedeemed:false};
  });
});
