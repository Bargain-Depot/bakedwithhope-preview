/* Approved-only pickup mini calendar, synchronized with checkout date select. */
(()=>{'use strict';
const select=document.querySelector('#bwhTestForm select[name="pickupDate"]');
if(!select)return;
const label=select.closest('label');
const panel=document.createElement('div');panel.className='bwh-mini-calendar';panel.setAttribute('aria-label','Approved pickup dates calendar');
panel.innerHTML='<div class="bwh-calendar-heading"><button type="button" class="bwh-month-prev" aria-label="Previous month">‹</button><strong class="bwh-month-label"></strong><button type="button" class="bwh-month-next" aria-label="Next month">›</button></div><div class="bwh-calendar-weekdays" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="bwh-calendar-days" role="group" aria-label="Pick an approved date"></div><p class="bwh-calendar-help">Only Tina’s approved pickup days can be selected.</p>';
label.append(panel);
let displayed=new Date();displayed.setDate(1);displayed.setHours(12,0,0,0);
const yyyyMMdd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const allowed=()=>new Set([...select.options].map(x=>x.value).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)));
function draw(){
 const dates=allowed(),month=displayed.getMonth(),year=displayed.getFullYear();
 panel.querySelector('.bwh-month-label').textContent=displayed.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 const first=new Date(year,month,1),end=new Date(year,month+1,0).getDate(),offset=first.getDay();
 const days=panel.querySelector('.bwh-calendar-days');days.replaceChildren();
 for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='bwh-calendar-blank';days.append(blank)}
 for(let day=1;day<=end;day++){
  const d=new Date(year,month,day,12);const iso=yyyyMMdd(d),button=document.createElement('button');
  button.type='button';button.className='bwh-calendar-day';button.textContent=day;button.disabled=!dates.has(iso);button.setAttribute('aria-label',d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}));
  if(select.value===iso){button.classList.add('selected');button.setAttribute('aria-pressed','true')}
  if(iso===yyyyMMdd(new Date()))button.classList.add('today');
  button.addEventListener('click',()=>{if(!dates.has(iso))return;select.value=iso;select.dispatchEvent(new Event('change',{bubbles:true}));draw()});
  days.append(button)
 }
 const bounds=[...dates].sort();
 const prev=new Date(year,month-1,1),next=new Date(year,month+1,1);
 panel.querySelector('.bwh-month-prev').disabled=!bounds.length||yyyyMMdd(new Date(prev.getFullYear(),prev.getMonth()+1,0))<bounds[0];
 panel.querySelector('.bwh-month-next').disabled=!bounds.length||yyyyMMdd(next)>bounds[bounds.length-1];
}
panel.querySelector('.bwh-month-prev').onclick=()=>{displayed.setMonth(displayed.getMonth()-1);draw()};
panel.querySelector('.bwh-month-next').onclick=()=>{displayed.setMonth(displayed.getMonth()+1);draw()};
function sync(){
 const dates=[...allowed()].sort();
 if(select.value&&/^\d{4}-/.test(select.value)){const [y,m]=select.value.split('-').map(Number);displayed=new Date(y,m-1,1,12)}
 else if(dates.length){const [y,m]=dates[0].split('-').map(Number);displayed=new Date(y,m-1,1,12)}
 draw();
}
new MutationObserver(sync).observe(select,{childList:true});
select.addEventListener('change',sync);
window.addEventListener('bwh:availability',()=>setTimeout(sync,0));
sync();
})();