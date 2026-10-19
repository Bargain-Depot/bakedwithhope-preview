'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {calculateGrant,completedOrderState,transferState,redemptionState}=require('../loyalty');

test('one verified order always adds exactly one punch',()=>{
  assert.deepEqual(calculateGrant({punches:3,lifetimePunches:8,rewardsEarned:0},1),{
    punches:4,lifetimePunches:9,rewardsEarned:0,rewardsIssued:0
  });
});

test('the tenth punch issues one reward and resets the card',()=>{
  assert.deepEqual(calculateGrant({punches:9,lifetimePunches:9,rewardsEarned:0},1),{
    punches:0,lifetimePunches:10,rewardsEarned:1,rewardsIssued:1
  });
});

test('physical-card transfer carries extra punches forward',()=>{
  assert.deepEqual(calculateGrant({punches:9,lifetimePunches:9,rewardsEarned:0},3),{
    punches:2,lifetimePunches:12,rewardsEarned:1,rewardsIssued:1
  });
});

test('large verified transfer can issue multiple rewards',()=>{
  assert.deepEqual(calculateGrant({punches:8,lifetimePunches:18,rewardsEarned:1},25),{
    punches:3,lifetimePunches:43,rewardsEarned:4,rewardsIssued:3
  });
});

test('invalid or corrupted counters are rejected',()=>{
  assert.throws(()=>calculateGrant({punches:-1,lifetimePunches:0,rewardsEarned:0},1));
  assert.throws(()=>calculateGrant({punches:0,lifetimePunches:0,rewardsEarned:0},0));
});

test('completed order IDs are idempotent and conflicting reuse is rejected',()=>{
  const order={customerId:'customer-1'};
  const ledger={customerId:'customer-1',delta:1,orderId:'order-1'};
  assert.equal(completedOrderState(null,null,'customer-1','order-1'),'new');
  assert.equal(completedOrderState(order,ledger,'customer-1','order-1'),'processed');
  assert.equal(completedOrderState(order,null,'customer-1','order-1'),'incomplete');
  assert.equal(completedOrderState(order,ledger,'customer-2','order-1'),'conflict');
});

test('manual transfer retries must match customer, amount, and reason',()=>{
  const transfer={customerId:'customer-1',delta:3,reason:'Paper card presented'};
  assert.equal(transferState(null,'customer-1',3,'Paper card presented'),'new');
  assert.equal(transferState(transfer,'customer-1',3,'Paper card presented'),'processed');
  assert.equal(transferState(transfer,'customer-1',4,'Paper card presented'),'conflict');
  assert.equal(transferState(transfer,'customer-1',3,'Different reason'),'conflict');
});

test('a reward is redeemable only while available',()=>{
  assert.equal(redemptionState({kind:'signature_pack_4',status:'available'}),'available');
  assert.equal(redemptionState({kind:'signature_pack_4',status:'redeemed'}),'redeemed');
  assert.equal(redemptionState({kind:'other',status:'available'}),'unsupported');
  assert.equal(redemptionState(null),'missing');
});
