/* Open Sweet Club account screen on the Log in tab, including if Firebase is unavailable. */
(()=>{'use strict';
const showLogin=()=>{
 const modal=document.getElementById('clubModal');if(!modal)return;
 const opener=document.querySelector('[data-club-open]');
 if(!modal.classList.contains('open'))opener?.click();
 if(!modal.classList.contains('open')){
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
 }
 const tab=modal.querySelector('[data-club-mode="login"]');tab?.click();
 modal.querySelectorAll('.club-auth-tab').forEach(b=>{
  const active=b.dataset.clubMode==='login';b.classList.toggle('active',active);
  if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 modal.querySelectorAll('.club-auth-panel').forEach(p=>{p.hidden=p.dataset.clubPanel!=='login'});
 if(location.hash==='#sweetClubLogin')history.replaceState(null,'',location.pathname+location.search+'#sweetClub');
};
document.addEventListener('click',event=>{
 const shortcut=event.target.closest('a[href="#sweetClubLogin"]');if(shortcut){event.preventDefault();showLogin()}
 if(event.target.closest('#clubClose')&&document.getElementById('clubModal')?.classList.contains('open')){
  const m=document.getElementById('clubModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';
 }
});
if(location.hash==='#sweetClubLogin')window.addEventListener('load',()=>setTimeout(showLogin,300),{once:true});
})();