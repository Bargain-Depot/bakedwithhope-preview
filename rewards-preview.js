(async()=>{
  'use strict';
  const root=document.getElementById('sweetClub');
  const modal=document.getElementById('clubModal');
  if(!root||!modal)return;

  const [{initializeApp},{
    createUserWithEmailAndPassword,getAuth,getIdTokenResult,onAuthStateChanged,
    sendEmailVerification,sendPasswordResetEmail,signInWithEmailAndPassword,
    signOut,updateProfile
  },{
    collection,doc,getDoc,getDocs,getFirestore,query,serverTimestamp,setDoc,where
  },{firebaseConfig}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js'),
    import('./firebase-config.js')
  ]);

  const app=initializeApp(firebaseConfig);
  const auth=getAuth(app);
  const db=getFirestore(app);
  const actionSettings={url:'https://bargain-depot.github.io/bakedwithhope-preview/orders.html#sweetClub'};
  const dialog=modal.querySelector('.club-dialog');
  let opener=null;
  dialog.innerHTML=`
    <button class="club-close" id="clubClose" aria-label="Close Sweet Club">×</button>
    <span class="club-preview-tag">BAKED WITH HOPE · SWEET CLUB</span>
    <h2 id="clubModalTitle">Your Sweet Club ♡</h2>
    <p id="clubGreeting">Sign in to see your punches, rewards, and history.</p>
    <div id="clubSignedOut">
      <form id="clubAuthForm">
        <label class="club-field">First name
          <input id="clubName" type="text" autocomplete="given-name" maxlength="80" placeholder="Your first name">
        </label>
        <label class="club-field">Email
          <input id="clubEmail" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com">
        </label>
        <label class="club-field">Password
          <input id="clubPassword" type="password" autocomplete="current-password" minlength="6" required placeholder="At least 6 characters">
        </label>
        <div class="club-actions">
          <button class="primary" id="clubSignIn" type="submit">Log in</button>
          <button class="club-secondary" id="clubCreate" type="button">Create account</button>
        </div>
        <button class="club-link" id="clubReset" type="button">Forgot your password?</button>
      </form>
    </div>
    <div id="clubDashboard" hidden>
      <div class="club-account-row">
        <span id="clubAccountEmail"></span>
        <button class="club-link" id="clubSignOut" type="button">Log out</button>
      </div>
      <section class="club-balance" aria-labelledby="clubBalanceHeading">
        <h3 id="clubBalanceHeading">Your punch card</h3>
        <div class="club-punches" id="clubPunches" aria-label="Sweet Club punch progress"></div>
        <strong id="clubPunchSummary">0 of 10 punches</strong>
        <p>Every verified completed order earns one punch. Extra punches carry forward.</p>
      </section>
      <div class="club-dashboard-grid">
        <section><h3>Available rewards</h3><div id="clubAvailableRewards" class="club-list"></div></section>
        <section><h3>Punch history</h3><div id="clubPunchHistory" class="club-list"></div></section>
      </div>
      <section><h3>Redeemed rewards</h3><div id="clubRedeemedRewards" class="club-list"></div></section>
      <a id="clubAdminLink" class="club-admin-link" href="admin.html" hidden>Open Tina's owner dashboard →</a>
    </div>
    <p id="clubStatus" class="club-note" role="status" aria-live="polite" hidden></p>`;

  const $=id=>document.getElementById(id);
  const status=(message,error=false)=>{
    const node=$('clubStatus');
    node.textContent=message;
    node.hidden=!message;
    node.classList.toggle('club-error',error);
  };
  const friendlyError=error=>({
    'auth/email-already-in-use':'An account already exists for that email.',
    'auth/invalid-credential':'The email or password is incorrect.',
    'auth/invalid-email':'Please enter a valid email address.',
    'auth/weak-password':'Choose a password with at least 6 characters.',
    'auth/too-many-requests':'Too many attempts. Please wait and try again.'
  }[error?.code]||'Something went wrong. Please try again.');
  const close=()=>{
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(opener&&typeof opener.focus==='function')opener.focus();
  };
  const open=()=>{
    opener=document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(()=>($('clubDashboard').hidden?$('clubEmail'):$('clubSignOut')).focus(),0);
  };
  document.querySelectorAll('[data-club-open]').forEach(button=>button.addEventListener('click',open));
  $('clubClose').addEventListener('click',close);
  modal.addEventListener('click',event=>{if(event.target===modal)close();});
  document.addEventListener('keydown',event=>{
    if(!modal.classList.contains('open'))return;
    if(event.key==='Escape'){close();return;}
    if(event.key!=='Tab')return;
    const focusable=[...modal.querySelectorAll('button:not([disabled]):not([hidden]),a[href],input:not([disabled])')]
      .filter(element=>element.getClientRects().length>0&&!element.closest('[hidden]'));
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  async function ensureProfile(user){
    const ref=doc(db,'profiles',user.uid);
    const snapshot=await getDoc(ref);
    if(!snapshot.exists()){
      await setDoc(ref,{
        uid:user.uid,
        email:user.email||'',
        displayName:user.displayName||'',
        punches:0,
        lifetimePunches:0,
        rewardsEarned:0,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      });
    }
    return (await getDoc(ref)).data();
  }
  const timestampValue=value=>value?.toDate?.().getTime?.()||0;
  const formatDate=value=>{
    const date=value?.toDate?.();
    return date?new Intl.DateTimeFormat(undefined,{dateStyle:'medium'}).format(date):'Pending';
  };
  function renderItems(container,items,render,empty){
    container.replaceChildren();
    if(!items.length){const item=document.createElement('p');item.className='club-empty';item.textContent=empty;container.append(item);return;}
    items.forEach(value=>{
      const item=document.createElement('article');
      item.className='club-list-item';
      const [title,detail]=render(value);
      const strong=document.createElement('strong');strong.textContent=title;
      const small=document.createElement('small');small.textContent=detail;
      item.append(strong,small);container.append(item);
    });
  }
  async function loadDashboard(user){
    const [profile,ledgerSnapshot,rewardsSnapshot,token]=await Promise.all([
      ensureProfile(user),
      getDocs(query(collection(db,'punchLedger'),where('customerId','==',user.uid))),
      getDocs(query(collection(db,'rewards'),where('customerId','==',user.uid))),
      getIdTokenResult(user)
    ]);
    const punches=Number.isSafeInteger(profile.punches)?profile.punches:0;
    $('clubPunches').replaceChildren(...Array.from({length:10},(_,index)=>{
      const punch=document.createElement('span');
      punch.className='club-punch'+(index<punches?' active':'');
      punch.textContent=index<punches?'♥':'♡';
      punch.setAttribute('aria-label',index<punches?'Punch earned':'Punch not yet earned');
      return punch;
    }));
    $('clubPunchSummary').textContent=`${punches} of 10 punches`;
    const ledger=ledgerSnapshot.docs.map(entry=>entry.data()).sort((a,b)=>timestampValue(b.createdAt)-timestampValue(a.createdAt));
    const rewards=rewardsSnapshot.docs.map(entry=>({id:entry.id,...entry.data()})).sort((a,b)=>timestampValue(b.createdAt)-timestampValue(a.createdAt));
    renderItems($('clubPunchHistory'),ledger,item=>[
      item.type==='legacy_transfer'?`+${item.delta} physical card punch${item.delta===1?'':'es'}`:'+1 verified order punch',
      `${formatDate(item.createdAt)} · ${item.type==='legacy_transfer'?(item.reason||'Manual transfer'):`Order ${item.orderId||''}`}`
    ],'No verified punches yet.');
    renderItems($('clubAvailableRewards'),rewards.filter(item=>item.status==='available'),item=>[
      'Free Signature Pack','4 mini cakes · Issued '+formatDate(item.createdAt)
    ],'Your next free Signature Pack appears here at 10 punches.');
    renderItems($('clubRedeemedRewards'),rewards.filter(item=>item.status==='redeemed'),item=>[
      'Signature Pack redeemed','Redeemed '+formatDate(item.redeemedAt)
    ],'No redeemed rewards yet.');
    $('clubAdminLink').hidden=token.claims.admin!==true;
  }

  $('clubAuthForm').addEventListener('submit',async event=>{
    event.preventDefault();status('Signing you in…');
    try{await signInWithEmailAndPassword(auth,$('clubEmail').value.trim(),$('clubPassword').value);status('');}
    catch(error){status(friendlyError(error),true);}
  });
  $('clubCreate').addEventListener('click',async()=>{
    const name=$('clubName').value.trim();
    if(!name){status('Please enter your first name.',true);$('clubName').focus();return;}
    status('Creating your Sweet Club account…');
    try{
      const credential=await createUserWithEmailAndPassword(auth,$('clubEmail').value.trim(),$('clubPassword').value);
      await updateProfile(credential.user,{displayName:name});
      await sendEmailVerification(credential.user,actionSettings);
      await signOut(auth);
      status('Account created! Check your inbox to verify your email. Then return here to log in.');
    }catch(error){status(friendlyError(error),true);}
  });
  $('clubReset').addEventListener('click',async()=>{
    const email=$('clubEmail').value.trim();
    if(!email){status('Enter your email first, then choose password reset.',true);return;}
    try{await sendPasswordResetEmail(auth,email,actionSettings);status('Password reset email sent.');}
    catch(error){status(friendlyError(error),true);}
  });
  $('clubSignOut').addEventListener('click',()=>signOut(auth));

  onAuthStateChanged(auth,async user=>{
    $('clubSignedOut').hidden=Boolean(user);
    $('clubDashboard').hidden=!user;
    if(!user){$('clubGreeting').textContent='Sign in to see your punches, rewards, and history.';return;}
    if(!user.emailVerified){
      await sendEmailVerification(user,actionSettings).catch(()=>{});
      await signOut(auth);
      status('Please verify your email before signing in. We sent a new verification message.',true);
      return;
    }
    $('clubGreeting').textContent=`Welcome${user.displayName?', '+user.displayName:''} ♡`;
    $('clubAccountEmail').textContent=user.email||'';
    status('Loading your rewards…');
    try{await loadDashboard(user);status('');}
    catch(error){console.error(error);status('Your account is signed in, but rewards could not be loaded yet.',true);}
  });

  const steps=root.querySelector('.club-steps');
  if(steps)steps.textContent='♡ Secure member account · ♡ 10-punch card · ♡ Free Signature Pack reward';
})();
