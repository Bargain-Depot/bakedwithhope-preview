/* Read-only order availability bridge. Never submits orders or changes Google Sheets. */
(()=>{'use strict';
const URL='https://script.google.com/macros/s/AKfycbyzHnskl5J9bOdANItTy1B819uoa1zAXd6TgkahTNiAfRC7H8SelhZpZePTeIZIwH6uLA/exec';
const host=document.getElementById('order');
if(!host)return;
const status=document.createElement('section');
status.className='bwh-order-status bwh-status-loading';
status.setAttribute('role','status');
status.setAttribute('aria-live','polite');
status.innerHTML='<div class="bwh-status-inner"><span class="bwh-status-eyebrow">BAKED WITH HOPE ♡</span><h2 id="bwhStatusHeading">Checking this week’s availability…</h2><p id="bwhStatusMessage">Please wait while we check Tina’s ordering schedule.</p></div>';
const heading=host.querySelector('.sectionhead');
(heading||host).insertAdjacentElement('afterend',status);
let state={ready:false,open:false,limitReached:false,approvedDates:[],umassApprovedDates:[],dateTimeframes:{},umassDateTimeframes:{}};
function updateDisplay(){
 const open=state.ready&&state.open;
 document.body.classList.toggle('bwh-sold-out',!open);
 document.body.classList.toggle('bwh-orders-open',open);
 document.body.classList.toggle('bwh-status-ready',state.ready);
 status.classList.toggle('bwh-status-loading',!state.ready);
 status.classList.toggle('bwh-status-open',open);
 status.classList.toggle('bwh-status-sold-out',!open&&state.ready);
 document.getElementById('bwhStatusHeading').textContent=!state.ready?'Ordering availability is unavailable':open?'Treats are available to order ♡':'Sold Out ♡';
 document.getElementById('bwhStatusMessage').textContent=!state.ready?'We can’t confirm pickup availability right now. Ordering remains unavailable until we can check with Tina.':open?'Tina is accepting orders. Choose from her approved pickup dates and timeframes when checkout is enabled.':state.statusMessage||'All treats are currently sold out. Please check back when orders reopen.';
 const nodes=document.querySelectorAll('.ux-option,.ux-product,.ux-drink-card,.ux-drink-option,.ux-featured-image,.sodacard');
 nodes.forEach(el=>{if(!el.classList.contains('bwh-stock-item'))el.classList.add('bwh-stock-item');});
 const available=window.bwhOrderAvailability;
 if(available)Object.assign(available,{...state});
}
window.bwhOrderAvailability={...state,refresh:load};
function render(){updateDisplay();window.dispatchEvent(new CustomEvent('bwh:availability',{detail:{...state}}));}
async function load(){
 status.classList.add('bwh-status-loading');
 try{
  const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),11000);
  let response;
  try{response=await fetch(URL+'?action=orderingState&t='+Date.now(),{method:'GET',cache:'no-store',signal:abort.signal});}
  finally{clearTimeout(timeout)}
  if(!response.ok)throw Error('Availability service unavailable');
  const data=await response.json();
  if(!data||data.ok!==true)throw Error(data?.message||'Availability request unsuccessful');
  state={
   ready:true,
   open:data.acceptingOrders===true&&data.limitReached!==true,
   limitReached:data.limitReached===true,
   statusMessage:typeof data.statusMessage==='string'?data.statusMessage:'',
   approvedDates:Array.isArray(data.approvedDates)?data.approvedDates:[],
   umassApprovedDates:Array.isArray(data.umassApprovedDates)?data.umassApprovedDates:[],
   dateTimeframes:data.dateTimeframes||{},
   umassDateTimeframes:data.umassDateTimeframes||{},
   weeklyLimit:data.weeklyLimit,currentOrderCount:data.currentOrderCount
  };
 }catch(error){state={ready:false,open:false,limitReached:false,approvedDates:[],umassApprovedDates:[],dateTimeframes:{},umassDateTimeframes:{}};}
 render();
}
document.addEventListener('click',event=>{
 if(!state.open&&(event.target.closest('[data-ux-plus],[data-ux-action="add"],[data-ux-action="next"],[data-ux-size],[data-ux-drink],#previewCheckout,#checkout'))){
  event.preventDefault();event.stopImmediatePropagation();status.scrollIntoView({behavior:'smooth',block:'center'});
 }
},true);
new MutationObserver(()=>{document.querySelectorAll('.ux-option,.ux-product,.ux-drink-card,.ux-drink-option,.sodacard').forEach(el=>el.classList.add('bwh-stock-item'))}).observe(document.getElementById('builder'),{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
window.addEventListener('focus',()=>{load()});
load();
})();