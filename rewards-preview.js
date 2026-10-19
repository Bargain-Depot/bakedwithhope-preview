(() => {
  'use strict';
  if (!document.getElementById('sweetClub')) return;
  const modal = document.getElementById('clubModal');
  const dialog = modal.querySelector('.club-dialog');
  const form = document.getElementById('clubForm');
  const name = document.getElementById('clubName');
  const email = document.getElementById('clubEmail');
  const password = document.getElementById('clubPassword');
  const result = document.getElementById('clubDemoResult');
  let mode = 'signup';
  let opener;
  let previousOverflow;
  const setMode = next => {
    mode = next;
    form.reset();
    result.hidden = true;
    document.getElementById('clubModalTitle').textContent = next === 'signup' ? 'Create account' : next === 'login' ? 'Log in' : 'Reset your password';
    document.getElementById('clubSubmit').textContent = next === 'signup' ? 'Create account' : next === 'login' ? 'Log in' : 'Send reset link';
    document.getElementById('clubNameField').hidden = next !== 'signup';
    name.disabled = next !== 'signup';
    document.getElementById('clubPasswordField').hidden = next === 'reset';
    password.disabled = next === 'reset';
    password.minLength = next === 'signup' ? 6 : 1;
    document.getElementById('clubVerification').hidden = next !== 'signup';
    document.getElementById('clubResetHelp').hidden = next !== 'reset';
    document.getElementById('clubForgot').hidden = next === 'reset';
    document.getElementById('clubBack').hidden = next !== 'reset';
    document.querySelectorAll('[data-club-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.clubMode === next)));
  };
  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = previousOverflow;
    form.reset();
    result.hidden = true;
    opener?.focus();
  };
  document.querySelectorAll('[data-club-open]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    previousOverflow = document.body.style.overflow;
    setMode('signup');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    name.focus();
  }));
  document.getElementById('clubClose').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.querySelectorAll('[data-club-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.clubMode)));
  document.getElementById('clubForgot').addEventListener('click', () => { setMode('reset'); email.focus(); });
  document.getElementById('clubBack').addEventListener('click', () => { setMode('login'); email.focus(); });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button, input')].filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    // UI preview only: no Firebase SDK, requests, local storage, or customer writes.
    form.reset();
    result.textContent = mode === 'signup'
      ? 'Registration is not live yet. No account was created and no verification email was sent.'
      : mode === 'login'
        ? 'Log in is not live yet. No sign-in was attempted.'
        : 'Password resets are not live yet. No reset email was sent.';
    result.hidden = false;
  });
})();
