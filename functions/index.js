'use strict';

/**
 * Sweet Club backend — deploy to the Firebase project owned by Tina.
 *
 * SECURITY: No customer-controlled callable is allowed to credit punches.
 * The confirmOrder callable is STAFF-ONLY for now. When payment/order processing
 * is connected, it must invoke the same transaction only after trusted payment
 * or pickup verification, never directly from a public checkout button.
 */
const {initializeApp}=require('firebase-admin/app');
const {getFirestore, FieldValue}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {onCall, HttpsError}=require('firebase-functions/v2/https');

initializeApp();
const db=getFirestore();
const THRESHOLD=10;
const REGION='us-east1';
const options={region:REGION, enforceAppCheck:false};

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
  return value.trim();
}
function count(value){
  if(!Number.isSafeInteger(value)||value<1||value>100)throw new HttpsError('invalid-argument','Transfer must be between 1 and 100 punches.');
  return value;
}
function profileDefaults(uid){
  return {uid, punches:0, lifetimePunches:0, rewardsEarned:0, createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp()};
}
function grantTransaction(tx,profileRef,profileSnapshot,amount,metadata){
  const p=profileSnapshot.exists?profileSnapshot.data():{punches:0,lifetimePunches:0,rewardsEarned:0};
  const current=Number(p.punches)||0;
  const lifetime=Number(p.lifetimePunches)||0;
  const earned=Number(p.rewardsEarned)||0;
  const incoming=current+amount;
  const newRewards=Math.floor(incoming/THRESHOLD);
  const remaining=incoming%THRESHOLD;
  const patch={
    uid:profileRef.id,punches:remaining,lifetimePunches:lifetime+amount,
    rewardsEarned:earned+newRewards,updatedAt:FieldValue.serverTimestamp()
  };
  if(!profileSnapshot.exists)patch.createdAt=FieldValue.serverTimestamp();
  tx.set(profileRef,patch,{merge:true});
  for(let i=1;i<=newRewards;i++){
    const serial=earned+i;
    // Predictable id makes retries safer; no client can write this collection.
    const rewardRef=db.doc('rewards/'+profileRef.id+'_signature_'+serial);
    tx.create(rewardRef,{
      customerId:profileRef.id,kind:'signature_pack_4',punchesUsed:THRESHOLD,
      status:'available',serial,source:metadata,
      createdAt:FieldValue.serverTimestamp(),redeemedAt:null,redeemedBy:null
    });
  }
  return {punches:remaining,rewardsIssued:newRewards};
}

/** Any signed-in customer can create their own empty profile, never punch credits. */
exports.ensureProfile=onCall(options,async(request)=>{
  const uid=authenticated(request);
  const ref=db.doc('profiles/'+uid);
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists)tx.create(ref,profileDefaults(uid));
  });
  return {success:true};
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
    if(existing.exists||entry.exists){
      if(existing.exists && existing.data().customerId!==customerId)throw new HttpsError('already-exists','Order belongs to another customer.');
      return {success:true,alreadyProcessed:true};
    }
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
    if(existing.exists){
      if(existing.data().customerId!==customerId)throw new HttpsError('already-exists','Transfer ID already used by another account.');
      return {success:true,alreadyProcessed:true};
    }
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
    if(!snapshot.exists)throw new HttpsError('not-found','Reward not found.');
    if(snapshot.data().kind!=='signature_pack_4')throw new HttpsError('invalid-argument','Unsupported reward type.');
    if(snapshot.data().status==='redeemed')return {success:true,alreadyRedeemed:true};
    if(snapshot.data().status!=='available')throw new HttpsError('failed-precondition','Reward is not available.');
    tx.update(rewardRef,{status:'redeemed',redeemedBy:staffId,redeemedAt:FieldValue.serverTimestamp()});
    return {success:true,alreadyRedeemed:false};
  });
});
