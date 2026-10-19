/* Baked with Hope — unified ordering experience (PREVIEW ONLY).
   One builder, one pricing map, zero network order/payment/account submission. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>'$'+Number(n).toFixed(2);
const cats=['Mini Cakes','8×8 Cakes','Cookie Bars','Sweet Bundles','Build Your Own Treat Box','Dirty Sodas'];
const mini=[{count:1,name:'Single Mini',price:5.5},{count:2,name:'Duo Pack',price:11},{count:4,name:'Signature Pack',price:20},{count:6,name:'Family Pack',price:29},{count:8,name:'Sampler Box',price:38},{count:12,name:'Celebration Box',price:54}];
const bars=[{count:1,name:'Single Bar',price:5},{count:2,name:'Two Bars',price:9},{count:4,name:'Four Bars',price:17},{count:6,name:'Six Bars',price:24}];
const mixed=[{count:4,name:'4 Treats',price:18},{count:6,name:'6 Treats',price:26},{count:8,name:'8 Treats',price:34},{count:12,name:'12 Treats',price:49}];
const bundles=[{name:'Sweet Duo',cakes:1,bars:1,price:9},{name:'Sweet 4',cakes:2,bars:2,price:17},{name:'Treat Box',cakes:3,bars:2,price:22}];
const drinks=[{name:'Cherry Vanilla Cloud',icon:'☁️',img:'dirty-soda-cherry-vanilla-2.webp'},{name:'Shark Bite',icon:'🦈',img:'dirty-soda-shark-bite-2.webp'},{name:'Strawberry Shortcake',icon:'🍓',img:'dirty-soda-strawberry-shortcake-2.webp'}];
const categoryInfo={
'Mini Cakes':['♡','Mini cakes','Build a box of mini cakes with your favorite flavors.'],
'8×8 Cakes':['✿','Celebration cakes','One beautiful 8×8 cake, made for your moments.'],
'Cookie Bars':['♥','Cookie bars','Mix your favorite cookie bars in one box.'],
'Sweet Bundles':['🎀','Sweet bundles','A little cake, a little cookie bar, a lot of joy.'],
'Build Your Own Treat Box':['✧','Mix & match','Make one box with mini cakes and cookie bars.'],
'Dirty Sodas':['🥤','Dirty sodas','Three flavors · 16 oz · $4 each.']
};
const state={category:cats.includes(category)?category:'Mini Cakes',stage:0,size:4,bundle:0,picks:{},tres:{},filter:'all',drink:0,drinkSize:'16 oz',addons:[],occasion:'',packaging:'none',ribbon:'',card:'',message:'',notes:'',topper:false,topperColor:'',glitter:false,glitterColor:''};
const choiceSet=()=>state.category==='Mini Cakes'?mini:state.category==='Cookie Bars'?bars:state.category==='Build Your Own Treat Box'?mixed:state.category==='8×8 Cakes'?[{count:1,name:'8×8 Celebration Cake',price:35}]:bundles;
const chosen=()=>state.category==='Sweet Bundles'?bundles[state.bundle]:choiceSet().find(v=>v.count===state.size)||choiceSet()[0];
const numberSelected=()=>Object.values(state.picks).reduce((a,n)=>a+n,0);
const selectedType=type=>catalog.filter(p=>p.type===type).reduce((a,p)=>a+(state.picks[p.id]||0),0);
const limit=()=>state.category==='8×8 Cakes'?1:state.category==='Sweet Bundles'?chosen().cakes+chosen().bars:chosen().count;
const full=()=>state.category==='8×8 Cakes';
const isMixed=()=>['Sweet Bundles','Build Your Own Treat Box'].includes(state.category);
const hasFlavors=()=>state.category!=='Dirty Sodas';
const miniTres=()=>Object.entries(state.tres).reduce((sum,[id,count])=>sum+Math.min(Number(count)||0,state.picks[id]||0)*(full()?4:1),0);
const selectedCaramel=()=>full()&&state.picks.caramel?4:0;
const packagingCharge=()=>state.packaging==='ribbon'?2:state.packaging==='card'?full()?2:3:0;
const eventCharge=()=>packagingCharge()+(full()&&state.topper?2:0)+(full()&&state.glitter?2:0);
const sodaBase=()=>4;
const baseCost=()=>state.category==='Dirty Sodas'?sodaBase():full()?35:chosen().price;
const totalCost=()=>baseCost()+(isMixed()||state.category==='Cookie Bars'||state.category==='Dirty Sodas'?0:miniTres()+selectedCaramel())+(full()||state.category==='Mini Cakes'||state.category==='Cookie Bars'?eventCharge():0);
const complete=()=>{
 if(!hasFlavors())return true;
 if(numberSelected()!==limit())return false;
 if(state.category==='Sweet Bundles')return selectedType('cakes')===chosen().cakes&&selectedType('bars')===chosen().bars;
 return true;
};
const fieldsOk=()=>{
 if(state.packaging!=='none'&&!state.ribbon.trim())return false;
 if(state.packaging==='card'&&(!state.card.trim()||!state.message.trim()))return false;
 if(full()&&state.topper&&!state.topperColor)return false;
 if(full()&&state.glitter&&!state.glitterColor)return false;
 return true;
};
const photo=(p)=>p.img||'';

function reset(){
 state.stage=0;state.picks={};state.tres={};state.filter='all';state.size=state.category==='8×8 Cakes'?1:state.category==='Mini Cakes'?4:state.category==='Cookie Bars'?2:4;
 state.bundle=0;state.drink=0;state.drinkSize='16 oz';state.addons=[];
 state.occasion='';state.packaging='none';state.ribbon='';state.card='';state.message='';state.notes='';state.topper=false;state.topperColor='';state.glitter=false;state.glitterColor='';
}
const stageLabels=()=>state.category==='Dirty Sodas'?['Pick a flavor','Your drink','Review']:full()?['Your cake','Choose flavor','Review']:['Choose a box','Pick flavors','Review'];
const heading=()=>categoryInfo[state.category];
function navigate(cat){
 if(!cats.includes(cat))return;
 category=cat;state.category=cat;reset();render();
 $('order')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function nav(){
 $('tabs').innerHTML=cats.map(c=>'<button type="button" class="tab ux-tab '+(c===state.category?'active':'')+'" data-ux-cat="'+esc(c)+'" aria-pressed="'+(c===state.category)+'">'+esc(categoryInfo[c][1])+'</button>').join('');
 $('tabs').querySelectorAll('[data-ux-cat]').forEach(b=>b.onclick=()=>navigate(b.dataset.uxCat));
}
function stages(){
 const labels=stageLabels();
 return '<div class="ux-steps" aria-label="Order progress">'+labels.map((name,i)=>'<button type="button" data-ux-step="'+i+'" '+(i>state.stage?'disabled':'')+' class="ux-step '+(i===state.stage?'is-current':i<state.stage?'is-complete':'')+'"><span class="ux-step-number">'+(i<state.stage?'✓':i+1)+'</span><span>'+name+'</span></button>').join('')+'</div>';
}
function priceCards(options,indexMode=false){
 return '<div class="ux-options">'+options.map((c,i)=>{
 const isActive=indexMode?state.bundle===i:state.size===c.count;
 const label=indexMode?c.cakes+' mini cake'+(c.cakes===1?'':'s')+' + '+c.bars+' cookie bar'+(c.bars===1?'':'s'):c.count+' treat'+(c.count===1?'':'s');
 return '<button type="button" class="ux-option '+(isActive?'selected':'')+'" data-ux-size="'+i+'" aria-pressed="'+isActive+'"><span class="ux-check">'+(isActive?'✓':'♡')+'</span><span class="ux-option-name">'+esc(c.name)+'</span><span class="ux-option-desc">'+label+'</span><strong>'+fmt(c.price)+'</strong></button>';
 }).join('')+'</div>';
}
function sizeStage(){
 const c=state.category;
 if(c==='Dirty Sodas')return '<div class="ux-intro"><h3>Choose your sip ♡</h3><p>Three dreamy favorites · 16 oz · just $4 each.</p></div>'+drinks.map((d,i)=>'<button type="button" class="ux-drink-choice '+(state.drink===i?'selected':'')+'" data-ux-drink="'+i+'"><img src="'+d.img+'" alt="" loading="lazy"><span><strong>'+d.icon+' '+esc(d.name)+'</strong><small>16 oz · $4.00</small></span><span class="ux-check">'+(state.drink===i?'✓':'♡')+'</span></button>').join('');
 if(full())return '<div class="ux-intro"><h3>Your celebration cake ♡</h3><p>A lovely 8×8 cake made for your occasion. Pick a flavor next.</p></div>'+priceCards([{count:1,name:'8×8 Celebration Cake',price:35}])+'<p class="ux-note">Starting at $35 · optional flavor and occasion upgrades shown before adding.</p>';
 if(c==='Sweet Bundles')return '<div class="ux-intro"><h3>Pick a sweet bundle ♡</h3><p>Every bundle shows exactly what is included and its total price.</p></div>'+priceCards(bundles,true);
 if(c==='Build Your Own Treat Box')return '<div class="ux-intro"><h3>Choose a mixed box ♡</h3><p>Pick any combination of mini cakes and cookie bars.</p></div>'+priceCards(mixed);
 if(c==='Cookie Bars')return '<div class="ux-intro"><h3>Choose your cookie bar box ♡</h3><p>All prices below are for the full box, not each bar.</p></div>'+priceCards(bars);
 return '<div class="ux-intro"><h3>Choose your mini cake box ♡</h3><p>Pick your box size and see the total before choosing flavors.</p></div>'+priceCards(mini);
}
function productList(){
 const showBars=state.category==='Cookie Bars';
 const products=catalog.filter(x=>isMixed()?state.filter==='all'||x.type===state.filter:x.type===(showBars?'bars':'cakes'));
 const max=limit(),sel=numberSelected(),atLimit=sel>=max;
 const title=state.category==='Sweet Bundles'?'Choose '+chosen().cakes+' mini cake'+(chosen().cakes===1?'':'s')+' and '+chosen().bars+' cookie bar'+(chosen().bars===1?'':'s'):sel+' / '+max+' selected';
 const featuredCake=full()?'<div class="ux-cake-feature"><img src="https://raw.githubusercontent.com/Bargain-Depot/bakedwithhope/main/8x8-cake.jpeg" alt="Example of a Baked with Hope 8×8 celebration cake" loading="lazy"><div><span class="ux-micro">ONE CAKE · MANY FLAVORS</span><strong>Your celebration cake</strong><p>This is our current cake photo. Choose the flavor you’d like below — the photo is an example, not a separate picture of every flavor.</p></div></div>':'';
 const selectedPhotos=!full()?catalog.flatMap(p=>Array.from({length:state.picks[p.id]||0},(_,i)=>({name:p.name,img:photo(p),tres:i<(state.tres[p.id]||0)}))):[];
 const visual=!full()?'<div class="ux-picked-preview" aria-label="Your chosen flavors"><div class="ux-picked-head"><strong>♡ Your sweet box</strong><span>'+sel+' / '+max+' selected</span></div><div class="ux-picked-slots">'+Array.from({length:max},(_,i)=>selectedPhotos[i]?'<div class="ux-picked-slot filled" title="'+esc(selectedPhotos[i].name)+(selectedPhotos[i].tres?' · Tres Leches':'')+'"><img src="'+esc(selectedPhotos[i].img)+'" alt="'+esc(selectedPhotos[i].name)+(selectedPhotos[i].tres?' Tres Leches':'')+'">'+(selectedPhotos[i].tres?'<span class="ux-picked-tres" aria-label="Tres Leches">TL</span>':'')+'</div>':'<div class="ux-picked-slot empty" aria-label="Empty slot">♡</div>').join('')+'</div></div>':'';
 const filter=isMixed()?'<div class="ux-filters">'+[['all','All treats'],['cakes','Mini cakes'],['bars','Cookie bars']].map(([id,n])=>'<button type="button" data-ux-filter="'+id+'" class="'+(state.filter===id?'active':'')+'">'+n+'</button>').join('')+'</div>':'';
 return '<div class="ux-intro"><h3>'+(full()?'Choose your cake flavor ♡':'Pick your favorites ♡')+'</h3><p>'+(full()?'Select one flavor for your 8×8 cake. You can add upgrades during review.':'Mix flavors however you like. The box total stays visible.')+'</p></div><div class="ux-selection-summary"><strong>'+title+'</strong><strong>'+fmt(totalCost())+'</strong></div><div class="ux-progress"><span style="width:'+(sel/max*100)+'%"></span></div>'+visual+featuredCake+filter+'<div class="ux-product-grid '+(full()?'ux-flavor-grid':'')+'">'+products.map(p=>{
  const count=state.picks[p.id]||0;
  const allowAdd=!atLimit&&!(state.category==='Sweet Bundles'&&selectedType(p.type)>=(p.type==='cakes'?chosen().cakes:chosen().bars));
  const img=photo(p);
  const showTres=!isMixed()&&!showBars&&p.type==='cakes'&&p.id!=='caramel';
  return '<article class="ux-product '+(full()?'ux-flavor-card':'')+'">'+(full()?'':'<div class="ux-product-media"><img src="'+esc(img)+'" loading="lazy" alt="'+esc(p.name)+'"></div>')+'<div class="ux-product-body"><span class="ux-micro">'+(p.type==='bars'?'COOKIE BAR':full()?'8×8 CAKE':'MINI CAKE')+'</span><h4>'+esc(p.name)+'</h4><div class="ux-quantity"><button type="button" aria-label="Remove '+esc(p.name)+'" data-ux-minus="'+p.id+'" '+(count===0?'disabled':'')+'>−</button><span aria-live="polite">'+count+'</span><button type="button" aria-label="Add '+esc(p.name)+'" data-ux-plus="'+p.id+'" '+(!allowAdd?'disabled':'')+'>+</button></div>'+(showTres&&count>0?'<div class="ux-tres-qty"><span>Tres Leches <small>+'+fmt(full()?4:1)+'/cake</small></span><div class="ux-tres-controls"><button type="button" data-ux-tres-minus="'+p.id+'" aria-label="One fewer '+esc(p.name)+' Tres Leches" '+(!(state.tres[p.id]>0)?'disabled':'')+'>−</button><strong>'+(state.tres[p.id]||0)+' of '+count+'</strong><button type="button" data-ux-tres-plus="'+p.id+'" aria-label="One more '+esc(p.name)+' Tres Leches" '+((state.tres[p.id]||0)>=count?'disabled':'')+'>+</button></div></div>':p.id==='caramel'&&!isMixed()&&!showBars?'<small class="ux-included">Tres Leches included</small>':'')+'</div></article>';
 }).join('')+'</div>'+(complete()?'<p class="ux-ready">♡ Your box is ready to review!</p>':'<p class="ux-note">Choose '+(max-sel)+' more '+(max-sel===1?'treat':'treats')+' to continue.</p>');
}
function flavorStage(){
 if(state.category==='Dirty Sodas')return '<div class="ux-intro"><h3>Your sweet sip ♡</h3><p>'+drinks[state.drink].icon+' '+esc(drinks[state.drink].name)+'</p></div><div class="ux-drink-fixed"><span>SIZE</span><strong>16 oz</strong><span>PRICE</span><strong>$4.00</strong><p>All dirty sodas are 16 oz and $4 each. No add-ons or extra charges.</p></div>';
 return productList();
}
function swatches(values,selected,attr){
 return '<option value="">Choose a color</option>'+values.map(v=>'<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(v)+'</option>').join('');
}
const ribbonColors=['Gold Glitter','Silver Glitter','White','Light Pink','Hot Pink','Peach','Orange','Red','Burgundy','Sage Green','Royal Blue','Navy Blue','Purple','Black'];
const cardColors=['Dusty Rose','Taupe Gray','Blush Pink','Powder Blue','Soft Peach','Sage Green'];
function eventOptions(){
 if(isMixed()||state.category==='Dirty Sodas')return '';
 return '<div class="ux-custom"><h3>Make it an occasion ♡</h3><p class="ux-note">Add a personal touch to your box or cake, if you like.</p><div class="ux-field-grid"><label class="ux-field">Occasion <input data-ux-event="occasion" maxlength="100" placeholder="Birthday, graduation…" value="'+esc(state.occasion)+'"></label><label class="ux-field">Gift packaging<select data-ux-event="packaging"><option value="none">No packaging · Free</option>'+(full()?'<option value="card" '+(state.packaging==='card'?'selected':'')+'>Ribbon + custom card · +$2</option>':'<option value="ribbon" '+(state.packaging==='ribbon'?'selected':'')+'>Ribbon only · +$2</option><option value="card" '+(state.packaging==='card'?'selected':'')+'>Ribbon + card · +$3</option>')+'</select></label>'+(state.packaging!=='none'?'<label class="ux-field">Ribbon color<select data-ux-event="ribbon">'+swatches(ribbonColors,state.ribbon)+'</select></label>':'')+(state.packaging==='card'?'<label class="ux-field">Card color<select data-ux-event="card">'+swatches(cardColors,state.card)+'</select></label><label class="ux-field full">Card message<textarea data-ux-event="message" maxlength="500" placeholder="Your message…">'+esc(state.message)+'</textarea></label>':'')+(full()?'<label class="ux-radio"><input type="checkbox" data-ux-event="topper" '+(state.topper?'checked':'')+'> Cake topper · +$2</label><label class="ux-radio"><input type="checkbox" data-ux-event="glitter" '+(state.glitter?'checked':'')+'> Edible glitter · +$2</label>'+(state.topper?'<label class="ux-field">Topper color<select data-ux-event="topperColor">'+swatches(['Gold','Silver','Black'],state.topperColor)+'</select></label>':'')+(state.glitter?'<label class="ux-field">Glitter color<select data-ux-event="glitterColor">'+swatches(['White','Gold'],state.glitterColor)+'</select></label>':''):'')+'<label class="ux-field full">Special instructions <textarea data-ux-event="notes" maxlength="500" placeholder="Anything Tina should know?">'+esc(state.notes)+'</textarea></label></div></div>';
}
function pickedNames(){
 return catalog.filter(x=>state.picks[x.id]).map(x=>state.picks[x.id]+'× '+x.name+(state.tres[x.id]?' ('+state.tres[x.id]+' Tres Leches, '+((state.picks[x.id]||0)-state.tres[x.id])+' regular)':'')).join(', ');
}
function reviewStage(){
 const c=state.category;
 const selection=c==='Dirty Sodas'?drinks[state.drink].icon+' '+drinks[state.drink].name+' · '+'16 oz':pickedNames();
 const name=c==='Sweet Bundles'?chosen().name:c==='8×8 Cakes'?'8×8 Celebration Cake':c==='Dirty Sodas'?drinks[state.drink].name:c==='Build Your Own Treat Box'?'Mix & Match · '+state.size+' treats':chosen().name;
 return '<div class="ux-intro"><h3>Your sweet little order ♡</h3><p>Everything together in one tidy place.</p></div><div class="ux-review"><div class="ux-review-header"><span>YOUR SELECTION</span><strong>'+fmt(totalCost())+'</strong></div><h4>'+esc(name)+'</h4><p>'+esc(selection)+'</p><dl><div><dt>Base price</dt><dd>'+fmt(baseCost())+'</dd></div>'+(miniTres()+selectedCaramel()>0?'<div><dt>Flavor upgrades</dt><dd>'+fmt(miniTres()+selectedCaramel())+'</dd></div>':'')+(eventCharge()>0&&(full()||c==='Mini Cakes'||c==='Cookie Bars')?'<div><dt>Occasion extras</dt><dd>'+fmt(eventCharge())+'</dd></div>':'')+'<div class="ux-total"><dt>Estimated subtotal</dt><dd>'+fmt(totalCost())+'</dd></div></dl></div>'+eventOptions()+'<p class="ux-note">No checkout or payment is processed in this preview. Availability and final pricing require Tina’s confirmation.</p>';
}
function render(){
 const root=$('builder');if(!root)return;
 nav();
 const [icon,title,description]=heading();
 const content=state.stage===0?sizeStage():state.stage===1?flavorStage():reviewStage();
 const canContinue=state.stage===1?complete():true;
 root.innerHTML='<div class="ux-builder"><div class="ux-builder-heading"><span class="ux-micro">THE SWEET SHOP · '+esc(icon)+'</span><h2>'+esc(title)+'</h2><p>'+esc(description)+'</p></div>'+stages()+'<div class="ux-stage" aria-live="polite">'+content+'</div><div class="ux-footer"><div class="ux-estimate"><small>ESTIMATED TOTAL</small><strong>'+fmt(totalCost())+'</strong></div><div class="ux-buttons">'+(state.stage>0?'<button type="button" class="ux-back" data-ux-action="back">← Back</button>':'')+(state.stage<2?'<button type="button" class="ux-next" data-ux-action="next" '+(!canContinue?'disabled':'')+'>'+(state.stage===0?'Choose flavors':'Review my order')+' →</button>':'<button type="button" class="ux-next" data-ux-action="add">Add to my bag ♡</button>')+'</div></div></div>';
 bind();
}
function goStage(next){state.stage=Math.min(2,Math.max(0,next));render();$('builder').scrollIntoView({behavior:'smooth',block:'start'})}
function bind(){
 const root=$('builder');
 root.querySelectorAll('[data-ux-step]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.uxStep)<=state.stage)goStage(Number(b.dataset.uxStep))});
 root.querySelectorAll('[data-ux-size]').forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.uxSize),item=choiceSet()[i];
  if(state.category==='Sweet Bundles')state.bundle=i;
  else if(item)state.size=item.count;
  state.picks={};state.tres={};render();
 });
 root.querySelectorAll('[data-ux-drink]').forEach(b=>b.onclick=()=>{state.drink=Number(b.dataset.uxDrink);render()});
 root.querySelectorAll('[data-ux-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.uxFilter;render()});
 root.querySelectorAll('[data-ux-plus]').forEach(b=>b.onclick=()=>{
  const p=catalog.find(x=>x.id===b.dataset.uxPlus);
  if(!p||numberSelected()>=limit())return;
  if(state.category==='Sweet Bundles'&&selectedType(p.type)>=(p.type==='cakes'?chosen().cakes:chosen().bars))return;
  state.picks[p.id]=(state.picks[p.id]||0)+1;render();
 });
 root.querySelectorAll('[data-ux-minus]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.uxMinus;if(!state.picks[id])return;
  state.picks[id]--;if(!state.picks[id]){delete state.picks[id];delete state.tres[id]}else state.tres[id]=Math.min(state.tres[id]||0,state.picks[id]);render();
 });
 root.querySelectorAll('[data-ux-tres-plus]').forEach(b=>b.onclick=()=>{const id=b.dataset.uxTresPlus;state.tres[id]=Math.min(state.picks[id]||0,(state.tres[id]||0)+1);render()});
 root.querySelectorAll('[data-ux-tres-minus]').forEach(b=>b.onclick=()=>{const id=b.dataset.uxTresMinus;state.tres[id]=Math.max(0,(state.tres[id]||0)-1);render()});
 root.querySelectorAll('input[name="uxDrinkSize"]').forEach(b=>b.onchange=()=>{state.drinkSize=b.value;render()});
 root.querySelectorAll('[data-ux-addon]').forEach(b=>b.onchange=()=>{state.addons=b.checked?[...state.addons,b.dataset.uxAddon]:state.addons.filter(x=>x!==b.dataset.uxAddon);render()});
 root.querySelectorAll('[data-ux-event]').forEach(el=>{
  const change=()=>{
   const key=el.dataset.uxEvent;state[key]=el.type==='checkbox'?el.checked:el.value;
   if(['packaging','topper','glitter'].includes(key)){render();return}
   const price=root.querySelector('.ux-estimate strong');if(price)price.textContent=fmt(totalCost());
   const reviewTotal=root.querySelector('.ux-review-header strong');if(reviewTotal)reviewTotal.textContent=fmt(totalCost());
   const line=root.querySelector('.ux-review .ux-total dd');if(line)line.textContent=fmt(totalCost());
  };
  el.addEventListener('change',change);
  if(el.tagName==='TEXTAREA'||el.tagName==='INPUT')el.addEventListener('input',change);
 });
 root.querySelectorAll('[data-ux-action]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.uxAction;
  if(action==='back')return goStage(state.stage-1);
  if(action==='next'){if(state.stage===1&&!complete())return;return goStage(state.stage+1)}
  if(action==='add')addToBag();
 });
}
function addToBag(){
 if(!complete()||!fieldsOk()){
  const warning=$('builder').querySelector('.ux-warning')||document.createElement('p');
  warning.className='ux-warning';warning.setAttribute('role','alert');
  warning.textContent=!complete()?'Please complete your flavor selection.':'Please complete the ribbon/card colors and any required custom details.';
  $('builder').querySelector('.ux-buttons')?.before(warning);return;
 }
 const c=state.category;
 const name=c==='Sweet Bundles'?chosen().name:full()?'8×8 Celebration Cake':c==='Dirty Sodas'?drinks[state.drink].name+' Dirty Soda':c==='Build Your Own Treat Box'?'Mix & Match · '+state.size+' Treat Box':c==='Cookie Bars'?chosen().name+' Cookie Bars':chosen().name;
 const selection=c==='Dirty Sodas'?drinks[state.drink].name+' · '+'16 oz':pickedNames();
 const details=[selection];
 if(state.occasion)details.push('Occasion: '+state.occasion);
 if(state.packaging!=='none')details.push('Packaging: '+(state.packaging==='card'?'ribbon + card':'ribbon')+' ('+state.ribbon+')');
 if(state.packaging==='card')details.push('Card: '+state.card+' · '+state.message);
 if(full()&&state.topper)details.push('Topper: '+state.topperColor);
 if(full()&&state.glitter)details.push('Glitter: '+state.glitterColor);
 if(state.notes)details.push('Notes: '+state.notes);
 bag.push({name,detail:details.join(' · '),price:Number(totalCost().toFixed(2)),quantity:1});
 renderBag();
 document.querySelector('.shop-header .bagbtn')?.click();
 const msg=document.createElement('p');msg.className='ux-success';msg.setAttribute('role','status');msg.textContent='Added to your sweet bag! ♡';
 $('builder').querySelector('.ux-buttons')?.before(msg);
 state.picks={};state.tres={};state.stage=0;
 setTimeout(()=>{render()},850);
}
const previousBagRender=renderBag;
renderBag=function(){previousBagRender();document.body.classList.toggle('bag-has-items',bag.length>0)};
reset();
window.bwhOrderExperience={navigate};
renderTabs=nav;renderSodas=render;
window.render=render;
render();
renderBag();
})();