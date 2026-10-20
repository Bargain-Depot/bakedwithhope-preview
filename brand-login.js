/* Header Sweet Club shortcut: opens the existing account modal on the Log in tab. */
(()=>{'use strict';
const openLogin=()=>{
 const modal=document.getElementById('clubModal');
 const opener=document.querySelector('[data-club-open]');
 if(!modal)return;
 if(!modal.classList.contains('open'))opener?.click();
 modal.querySelector('[data-club-mode="login"]')?.click();
 if(location.hash==='#sweetClubLogin')history.replaceState(null,'',location.pathname+location.search+'#sweetClub');
};
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href="#sweetClubLogin"]');
 if(!link)return;
 e.preventDefault();
 openLogin();
});
if(location.hash==='#sweetClubLogin'){
 window.addEventListener('load',()=>setTimeout(openLogin,400),{once:true});
}
})();