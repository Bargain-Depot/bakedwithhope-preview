/* Load the actual member app only after the protected Firebase backend is deployed.
 * The existing disabled preview stays visible if Sweet Club is not launched. */
(async () => {
  const root = document.getElementById('sweetClub');
  if (!root) return;
  try {
    const { sweetClubConfig } = await import('./sweet-club-config.js?v=1');
    if (!sweetClubConfig.enabled) return;
    await import('./rewards-preview.js?v=5');
    const sectionText = root.querySelector('.club-grid > div > p:not(.club-steps)');
    if (sectionText) sectionText.textContent =
      'Create your free account, follow your verified purchases, and earn one free Signature Pack every 10 punches. Tina confirms each punch after an order is completed.';
    const button = root.querySelector('[data-club-open]');
    if (button) button.textContent = 'My Sweet Club ♡';
    const note = root.querySelector('.club-card .club-note');
    if (note) note.textContent =
      'Every verified completed order earns one punch. Rewards appear in your account automatically when you reach 10 punches. Ask Tina about transferring your existing paper card.';
  } catch (error) {
    console.error('Sweet Club initialization failed:', error);
    // Don't display a working signup button or collect passwords when backend is unavailable.
    const disabled = document.querySelector('.club-launch-note');
    if (disabled) disabled.textContent =
      'Sweet Club is currently unavailable. Please try again later; no account information was submitted.';
  }
})();
