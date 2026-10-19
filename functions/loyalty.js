'use strict';

const REWARD_THRESHOLD=10;

function requireNonNegativeInteger(value,label){
  if(!Number.isSafeInteger(value)||value<0)throw new TypeError(label+' must be a non-negative integer.');
  return value;
}

function calculateGrant(profile,amount){
  const punches=requireNonNegativeInteger(profile.punches,'punches');
  const lifetimePunches=requireNonNegativeInteger(profile.lifetimePunches,'lifetimePunches');
  const rewardsEarned=requireNonNegativeInteger(profile.rewardsEarned,'rewardsEarned');
  if(!Number.isSafeInteger(amount)||amount<1||amount>100)throw new TypeError('amount must be an integer from 1 to 100.');
  const incoming=punches+amount;
  const rewardsIssued=Math.floor(incoming/REWARD_THRESHOLD);
  return {
    punches:incoming%REWARD_THRESHOLD,
    lifetimePunches:lifetimePunches+amount,
    rewardsEarned:rewardsEarned+rewardsIssued,
    rewardsIssued
  };
}

function completedOrderState(order,ledger,customerId,orderId){
  if(!order&&!ledger)return 'new';
  if(!order||!ledger)return 'incomplete';
  if(order.customerId!==customerId||ledger.customerId!==customerId||ledger.delta!==1||ledger.orderId!==orderId)return 'conflict';
  return 'processed';
}

function transferState(transfer,customerId,amount,reason){
  if(!transfer)return 'new';
  if(transfer.customerId!==customerId||transfer.delta!==amount||transfer.reason!==reason)return 'conflict';
  return 'processed';
}

function redemptionState(reward){
  if(!reward)return 'missing';
  if(reward.kind!=='signature_pack_4')return 'unsupported';
  if(reward.status==='redeemed')return 'redeemed';
  if(reward.status!=='available')return 'unavailable';
  return 'available';
}

module.exports={REWARD_THRESHOLD,calculateGrant,completedOrderState,transferState,redemptionState};
