/* Guided shopping flow: box size → flavors → review. Preview checkout remains disabled. */
(()=>{
'use strict';
const sizes={ 'Mini Cakes':[1,2,4,6,8,12], 'Cookie Bars':[1,2,4,6] };
const phases={};
const getPhase=()=>phases[category]||'size';
const setPhase=p=>{phases[category]=p;render();document.getElementById('builder')?.scrollIntoView({behavior:'smooth',block:'start'})};
function renderSteps(){
  const root=document.getElementById('builder');
  if(!root||category==='Dirty Sodas')return;
  const isMixed=category==='Sweet Bundles'||category==='Build Your Own Treat Box';
  const full=category==='8×8 Cakes';
  const phase=getPhase();
  const stages=['size','flavors','review'];
  const current=stages.indexOf(phase);
  const label1=full?'Cake type':category==='Sweet Bundles'?'Bundle':'Box size';
  const steps=document.createElement('div');
  steps.className='guided-steps';
  steps.setAttribute('aria-label','Order progress');
  steps.innerHTML=stages.map((p,i)=>'<button type="button" data-stage="'+p+'" class="guided-step '+(i===current?'current':i<current?'complete':'')+'" '+(i>current?'disabled':'')+'><span class="guided-num">'+(i<current?'✓':i+1)+'</span><span>'+(i===0?label1:i===1?'Flavors':'Review')+'</span></button>').join('');
  root.prepend(steps);
  steps.querySelectorAll('[data-stage]:not([disabled])').forEach(btn=>btn.addEventListener('click',()=>setPhase(btn.dataset.stage)));
  const toggles={
    sizes:[root.querySelector('.packs'),root.querySelector('.mix-choice')],
    flavor:[root.querySelector('.products'),root.querySelector('.mix-grid'),root.querySelector('.mix-filter'),root.querySelector('.progress'),root.querySelector('.box-visual')],
    event:[root.querySelector('.event-upgrades')],
    summary:[root.querySelector('#addBox')?.parentElement,root.querySelector('.mix-summary')]
  };
  const countEl=[...root.children].find(el=>el.tagName==='STRONG'&&el.textContent.includes('selected'));
  const isSelect=phase==='size',isFlavors=phase==='flavors',isReview=phase==='review';
  toggles.sizes.filter(Boolean).forEach(el=>el.classList.toggle('guided-hidden',!isSelect));
  toggles.flavor.filter(Boolean).forEach(el=>el.classList.toggle('guided-hidden',!isFlavors&&!(isReview&&el.classList.contains('box-visual'))));
  toggles.event.filter(Boolean).forEach(el=>el.classList.toggle('guided-hidden',!isReview));
  toggles.summary.filter(Boolean).forEach(el=>el.classList.toggle('guided-hidden',!isReview));
  if(countEl)countEl.classList.toggle('guided-hidden',!isFlavors);
  const allPacks=root.querySelectorAll('[data-pack]');
  if(category==='Cookie Bars'){
    allPacks.forEach(btn=>{if(!sizes['Cookie Bars'].includes(Number(btn.dataset.pack)))btn.hidden=true});
  }
  const instruction=document.createElement('div');instruction.className='guided-heading';
  const picked=typeof qty==='function'?qty():0;
  const count=full?1:typeof pack==='number'?pack:1;
  const summary=isMixed
    ?category==='Sweet Bundles'?'Choose your bundle, then customize the treats inside.':'Pick a box size, then mix mini cakes with cookie bars.'
    :isSelect?(full?'Your 8×8 cake includes one flavor. Continue to choose it.':'Select the number of '+(category==='Cookie Bars'?'cookie bars':'mini cakes')+' you want.')
    :isFlavors?'Choose your flavors. You can mix and match until your box is full.':'Review your flavors and add any occasion extras before adding to your bag.';
  instruction.innerHTML='<p class="guided-kicker">STEP '+(current+1)+' OF 3</p><h3>'+(isSelect?label1:isFlavors?'Pick your flavors':'Finishing touches')+'</h3><p>'+summary+'</p>';
  steps.after(instruction);
  const actions=document.createElement('div');
  actions.className='guided-actions';
  if(!isSelect) actions.innerHTML+='<button type="button" class="guided-back">← Back</button>';
  if(isSelect)actions.innerHTML+='<button type="button" class="guided-next">Choose flavors <span aria-hidden="true">→</span></button>';
  if(isFlavors)actions.innerHTML+='<button type="button" class="guided-next" '+(!isMixed&&picked!==count?'disabled':'')+'>Review my box <span aria-hidden="true">→</span></button>';
  if(isReview)actions.innerHTML+='<p class="guided-review-hint">Check your selections and add your box to the bag when ready.</p>';
  root.append(actions);
  actions.querySelector('.guided-back')?.addEventListener('click',()=>setPhase(isReview?'flavors':'size'));
  const next=actions.querySelector('.guided-next');
  if(next){
    next.addEventListener('click',()=>{
      if(phase==='size'){setPhase('flavors');return}
      if(isMixed){
        const mixSummary=root.querySelector('.mix-summary');
        const mixButton=mixSummary?.querySelector('#mixAdd');
        if(!mixButton||mixButton.disabled){const message=document.createElement('p');message.className='guided-warning';message.setAttribute('role','status');message.textContent='Please complete your treat selection first.';actions.append(message);return}
      }else if(picked!==count){return}
      setPhase('review');
    });
  }
  // For mixed boxes, next step is enabled only once the original builder enables Add to bag.
  if(isMixed&&isFlavors&&next)next.disabled=Boolean(root.querySelector('#mixAdd')?.disabled);
  const add=root.querySelector('#addBox, #mixAdd');
  if(add)add.addEventListener('click',()=>{
    if(add.disabled)return;
    phases[category]='size';
  },{capture:true});
  if(isReview){
    const back=document.createElement('button');back.className='guided-edit-size';back.type='button';back.textContent='Change box size';back.addEventListener('click',()=>setPhase('size'));
    instruction.append(back);
  }
}
const prevRender=render;
render=function(){prevRender();renderSteps()};
document.addEventListener('click',e=>{
  const tab=e.target.closest('[data-tab],[data-mixed-tab]');
  if(!tab)return;
  const target=tab.dataset.tab||tab.dataset.mixedTab;
  if(target&&target!==category)phases[target]='size';
},true);
render();
})();
