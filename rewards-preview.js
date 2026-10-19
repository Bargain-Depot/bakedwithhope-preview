(()=>{'use strict';
const root=document.getElementById('sweetClub');
const modal=document.getElementById('clubModal');
if(!root||!modal)return;
const closeButton=document.getElementById('clubClose');
let opener=null;
function setMode(mode){
 if(!['signup','login','reset'].includes(mode))return;
 modal.querySelectorAll('[data-club-panel]').forEach(panel=>{panel.hidden=panel.dataset.clubPanel!==mode;});
 modal.querySelectorAll('.club-auth-tab').forEach(tab=>{
  const current=tab.dataset.clubMode===mode;
  tab.classList.toggle('active',current);
  if(current)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
 });
}
function open(){
 opener=document.activeElement;
 setMode('signup');
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 closeButton.focus();
}
function close(){
 modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
 document.body.style.overflow='';
 if(opener&&typeof opener.focus==='function')opener.focus();
}
document.querySelectorAll('[data-club-open]').forEach(button=>button.addEventListener('click',open));
closeButton.addEventListener('click',close);
modal.addEventListener('click',event=>{
 if(event.target===modal)close();
 const button=event.target.closest('[data-club-mode]');
 if(button&&modal.contains(button))setMode(button.dataset.clubMode);
});
modal.querySelectorAll('.club-auth-form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
document.addEventListener('keydown',event=>{
 if(!modal.classList.contains('open'))return;
 if(event.key==='Escape'){close();return;}
 if(event.key!=='Tab')return;
 const focusable=[...modal.querySelectorAll('button:not([disabled]):not([hidden]),a[href],input:not([disabled])')]
  .filter(el=>el.getClientRects().length>0&&!el.closest('[hidden]'));
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
})();
