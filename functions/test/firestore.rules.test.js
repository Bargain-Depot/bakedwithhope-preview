'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,getDoc,serverTimestamp,setDoc,updateDoc}=require('firebase/firestore');

let env;
test.before(async()=>{
  env=await initializeTestEnvironment({
    projectId:'baked-with-hope-preview-test',
    firestore:{rules:readFileSync(resolve(__dirname,'../../firestore.rules'),'utf8')}
  });
});
test.after(async()=>{await env.cleanup();});
test.beforeEach(async()=>{await env.clearFirestore();});

function profile(uid,email,punches=0){
  return {uid,email,displayName:'Hope',punches,lifetimePunches:0,rewardsEarned:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
}

test('customer can create only their own zero-balance profile',async()=>{
  const db=env.authenticatedContext('alice',{email:'alice@example.com',email_verified:true}).firestore();
  await assertSucceeds(setDoc(doc(db,'profiles/alice'),profile('alice','alice@example.com')));
  await assertFails(setDoc(doc(db,'profiles/bob'),profile('bob','alice@example.com')));
  await assertFails(setDoc(doc(db,'profiles/mallory'),profile('mallory','alice@example.com',9)));
});

test('customer cannot update punch or reward counters',async()=>{
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'profiles/alice'),{
    uid:'alice',email:'alice@example.com',displayName:'Hope',punches:0,lifetimePunches:0,rewardsEarned:0
  }));
  const db=env.authenticatedContext('alice',{email:'alice@example.com',email_verified:true}).firestore();
  await assertFails(updateDoc(doc(db,'profiles/alice'),{punches:9}));
});

test('customers are isolated while an admin can read profiles',async()=>{
  await env.withSecurityRulesDisabled(async context=>Promise.all([
    setDoc(doc(context.firestore(),'profiles/alice'),{uid:'alice'}),
    setDoc(doc(context.firestore(),'profiles/bob'),{uid:'bob'})
  ]));
  const alice=env.authenticatedContext('alice',{email_verified:true}).firestore();
  const admin=env.authenticatedContext('tina',{admin:true}).firestore();
  await assertSucceeds(getDoc(doc(alice,'profiles/alice')));
  await assertFails(getDoc(doc(alice,'profiles/bob')));
  await assertSucceeds(getDoc(doc(admin,'profiles/bob')));
});

test('ledger and rewards are server-writable and owner-readable only',async()=>{
  await env.withSecurityRulesDisabled(async context=>Promise.all([
    setDoc(doc(context.firestore(),'punchLedger/order_1'),{customerId:'alice',delta:1}),
    setDoc(doc(context.firestore(),'rewards/reward_1'),{customerId:'alice',status:'available'})
  ]));
  const alice=env.authenticatedContext('alice',{email_verified:true}).firestore();
  const bob=env.authenticatedContext('bob',{email_verified:true}).firestore();
  await assertSucceeds(getDoc(doc(alice,'punchLedger/order_1')));
  await assertSucceeds(getDoc(doc(alice,'rewards/reward_1')));
  await assertFails(getDoc(doc(bob,'punchLedger/order_1')));
  await assertFails(setDoc(doc(alice,'punchLedger/fake'),{customerId:'alice',delta:100}));
  assert.ok(true);
});

test('unverified customers cannot create or read Sweet Club records',async()=>{
  const db=env.authenticatedContext('alice',{email:'alice@example.com',email_verified:false}).firestore();
  await assertFails(setDoc(doc(db,'profiles/alice'),profile('alice','alice@example.com')));
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'profiles/alice'),{uid:'alice'}));
  await assertFails(getDoc(doc(db,'profiles/alice')));
});
