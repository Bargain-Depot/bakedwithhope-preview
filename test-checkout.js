/* Customer checkout connected to the existing Baked with Hope Apps Script. */
(()=>{'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbyzHnskl5J9bOdANItTy1B819uoa1zAXd6TgkahTNiAfRC7H8SelhZpZePTeIZIwH6uLA/exec';
const trigger=document.getElementById('checkout');
if(!trigger||typeof window.bwhReadCart!=='function')return;
const section=document.createElement('section');
section.id='bwhTestCheckout';section.className='bwh-test-checkout';section.hidden=true;
section.innerHTML=`<div class="bwh-test-checkout-inner"><button type="button" id="bwhTestClose" aria-label="Close checkout">×</button>
<span class="bwh-test-flag">LIVE ORDER REQUEST</span><h2>Finish your order ♡</h2>
<p class="bwh-test-warning">This submits an order to the existing bakery dashboard and uses weekly capacity. Please review before sending. Payment is not collected online.</p>
<form id="bwhTestForm">
<div class="bwh-test-fields">
<label>Full name<input name="name" autocomplete="name" maxlength="100" required></label>
<label>Email<input type="email" name="email" autocomplete="email" required></label>
<label>Phone<input type="tel" name="phone" autocomplete="tel" maxlength="40" required></label>
<label>Payment preference<select name="payment" required><option value="">Select method</option><option>Venmo</option><option>Cash App</option><option>Zelle</option><option>Cash</option></select></label>
<label>Pickup location<select name="location"><option value="regular">Regular pickup</option><option value="umass">UMass Boston pickup</option></select><small id="bwhSodaPickupNote" class="bwh-soda-pickup-note" role="status" hidden>Dirty sodas are available for regular pickup only so they stay cold and fresh. Remove all dirty sodas from your bag to select UMass Boston pickup.</small></label>
<label>Approved pickup date<select name="pickupDate" required><option value="">Choose a date</option></select></label>
<label>Approved pickup timeframe<select name="pickupTimeframe" required><option value="">Choose a timeframe</option></select></label>
<label class="bwh-test-notes">Additional instructions<textarea name="notes" rows="2" maxlength="500"></textarea></label>
</div>
<p id="bwhTestSummary"></p>
<label class="bwh-test-policy"><input type="checkbox" name="policy" required> I agree to the <a href="https://bakedwithhope.com/order-policy.html" target="_blank" rel="noopener noreferrer">Baked with Hope order policy</a>.</label>
<button type="submit" id="bwhTestSubmit" class="primary">Submit order ♡</button>
<p id="bwhTestResult" role="status" aria-live="polite"></p>
</form></div>`;
document.getElementById('order').querySelector('.shell').append(section);
const form=section.querySelector('form'),date=form.elements.pickupDate,time=form.elements.pickupTimeframe,loc=form.elements.location;
const result=document.getElementById('bwhTestResult'),submit=document.getElementById('bwhTestSubmit');
const sodaPickupNote=document.getElementById('bwhSodaPickupNote');
const umassOption=loc.querySelector('option[value="umass"]');
function isDirtySoda(item){
 return item?.category==='Dirty Sodas'||/dirty soda/i.test(String(item?.name||''));
}
function syncSodaPickup(){
 const sodaInBag=(window.bwhReadCart?.()||[]).some(isDirtySoda);
 if(umassOption)umassOption.disabled=sodaInBag;
 if(sodaPickupNote)sodaPickupNote.hidden=!sodaInBag;
 if(sodaInBag&&loc.value==='umass'){
  loc.value='regular';
  refreshDates();
 }
 return sodaInBag;
}
window.addEventListener('bwh:cart-changed',()=>{
 const oldLocation=loc.value;
 syncSodaPickup();
 if(!section.hidden&&oldLocation!==loc.value)refreshDates();
});
const drawerTrigger=document.getElementById('previewCheckout');
function syncCheckoutButtons(){
 const a=window.bwhOrderAvailability||{};
 const enabled=a.ready===true&&a.open===true;
 [trigger,drawerTrigger].filter(Boolean).forEach(button=>{
  button.disabled=!enabled;
  button.textContent=enabled?'Checkout →':a.ready?'Sold Out ♡':'Checking availability…';
 });
}
drawerTrigger?.addEventListener('click',()=>{
 if(drawerTrigger.disabled)return;
 document.getElementById('closeDrawer')?.click();
 trigger.click();
});

let sending=false;
function current(){return window.bwhOrderAvailability||{};}
function options(select,values,placeholder){
 select.replaceChildren(new Option(placeholder,''));
 values.forEach(v=>select.add(new Option(v,v)));
}
function refreshDates(){
 const a=current(),dates=loc.value==='umass'?a.umassApprovedDates:a.approvedDates;
 const times=loc.value==='umass'?a.umassDateTimeframes:a.dateTimeframes;
 options(date,Array.isArray(dates)?dates.filter(d=>Array.isArray(times?.[d])&&times[d].length):[],'Choose an approved pickup date');
 refreshTimes();
}
function refreshTimes(){
 const a=current(),times=loc.value==='umass'?a.umassDateTimeframes:a.dateTimeframes;
 options(time,Array.isArray(times?.[date.value])?times[date.value]:[],'Choose a timeframe');
}
loc.addEventListener('change',()=>{if(syncSodaPickup()&&loc.value==='umass'){loc.value='regular'}refreshDates()});date.addEventListener('change',refreshTimes);
trigger.addEventListener('click',()=>{
 const a=current();if(a.ready!==true||a.open!==true)return;
 const items=window.bwhReadCart();
 if(!items.length){result.textContent='Add a treat to your bag first.';section.hidden=false;section.scrollIntoView({behavior:'smooth'});return;}
 syncSodaPickup();
 refreshDates();
 document.getElementById('bwhTestSummary').textContent=items.map(i=>i.name+' — $'+Number(i.price).toFixed(2)).join(' · ');
 section.hidden=false;section.scrollIntoView({behavior:'smooth',block:'start'});
});
document.getElementById('bwhTestClose').addEventListener('click',()=>{if(!sending)section.hidden=true;});
window.addEventListener('bwh:availability',()=>{
 const a=current(),ready=a.ready===true&&a.open===true;
 syncCheckoutButtons();
 if(!section.hidden)refreshDates();
});
async function send(data){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(ENDPOINT,{method:'POST',body:JSON.stringify(data),signal:controller.signal,redirect:'follow'});
  if(!response.ok)throw Error('Order service returned HTTP '+response.status);
  const answer=await response.json();
  if(!answer.ok)throw Error(answer.message||'Order not accepted');
  return answer;
 }finally{clearTimeout(timeout)}
}
syncCheckoutButtons();syncSodaPickup();
form.addEventListener('submit',async event=>{
 event.preventDefault();if(sending||!form.reportValidity())return;
 const a=current(),items=window.bwhReadCart();
 if(!a.ready||!a.open){result.textContent='Ordering is unavailable. Please refresh the status.';return;}
 if(!items.length){result.textContent='Your bag is empty.';return;}
 const requestedUmass=loc.value==='umass';
 if(requestedUmass&&items.some(isDirtySoda)){result.textContent='UMass Boston pickup is unavailable for dirty sodas. Please choose regular pickup or remove the drinks.';return;}
 const allowedDates=loc.value==='umass'?a.umassApprovedDates:a.approvedDates;
 const allowedTimes=loc.value==='umass'?a.umassDateTimeframes:a.dateTimeframes;
 if(!Array.isArray(allowedDates)||!allowedDates.includes(date.value)||!Array.isArray(allowedTimes?.[date.value])||!allowedTimes[date.value].includes(time.value)){result.textContent='Select an approved pickup date and timeframe.';return;}
 // A mixed cart is one dashboard order, but preserve its distinct product
 // categories and complete flavor selections for Tina's prep sheet.
 const categoryOf=item=>{
  const name=String(item.name||'');
  if(item.category==='Dirty Sodas'||/dirty soda/i.test(name))return 'DIRTY SODAS';
  if(item.category==='Cookie Bars'||/cookie bar/i.test(name))return 'COOKIE BARS';
  if(item.category==='8×8 Cakes'||/8[×x]8|celebration cake/i.test(name))return 'CELEBRATION CAKES';
  if(item.category==='Sweet Bundles'||/bundle/i.test(name))return 'SWEET BUNDLES';
  if(item.category==='Build Your Own Treat Box'||/mix.*match|treat box/i.test(name))return 'MIXED TREAT BOXES';
  return 'MINI CAKES';
 };
 const grouped=new Map();
 items.forEach(item=>{
  const category=categoryOf(item);
  if(!grouped.has(category))grouped.set(category,[]);
  grouped.get(category).push(item);
 });
 const total=items.reduce((sum,x)=>sum+Number(x.price||0)*Number(x.quantity||1),0);
 const summary=[...grouped.entries()].map(([category,entries])=>
  category+': '+entries.map(item=>{
   const qty=Number(item.quantity||1);
   return (qty>1?qty+'× ':'')+String(item.name||'Treat');
  }).join('; ')
 ).join(' | ');
 const detailLines=[...grouped.entries()].flatMap(([category,entries])=>[
  '['+category+']',
  ...entries.map(item=>
   (Number(item.quantity||1)>1?Number(item.quantity)+'× ':'')+
   String(item.name||'Treat')+' — '+String(item.detail||'No flavor details')+
   ' ($'+(Number(item.price||0)*Number(item.quantity||1)).toFixed(2)+')'
  )
 ]);
 const prepBreakdown=[...grouped.entries()].map(([category,entries])=>
  category+': '+entries.reduce((sum,item)=>sum+Number(item.quantity||1),0)+' selection(s)'
 ).join(' | ');
 const data={
  action:'submitOrder',
  orderType:(loc.value==='umass'?'UMass Boston — ':'')+'Mixed Treat Order',
  name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),phone:form.elements.phone.value.trim(),
  box:summary,
  flavor:detailLines.join('\\n'),
  quantity:items.reduce((n,x)=>n+Number(x.quantity||1),0),
  total:total.toFixed(2),
  payment:form.elements.payment.value,
  pickupDate:date.value,pickupTimeframe:time.value,
  notes:'WEB ORDER — MIXED CART. Prep breakdown: '+prepBreakdown+'; '+items.length+' cart line(s). Customer notes: '+form.elements.notes.value.trim(),
  customPackaging:{enabled:false},
  policyAccepted:form.elements.policy.checked
 };
 sending=true;submit.disabled=true;result.textContent='Submitting your order… Please do not click twice.';
 try{
  const answer=await send(data);
  result.textContent='Order '+answer.orderNumber+' received by the bakery. Watch for an email confirmation.';
  window.bwhClearCart?.();form.reset();refreshDates();section.hidden=false;
 }catch(error){
  result.textContent='Could not confirm the order: '+(error.name==='AbortError'?'request timed out':error.message)+'. Contact the bakery before retrying to avoid duplicates.';
 }finally{sending=false;submit.disabled=false;}
});
})();
