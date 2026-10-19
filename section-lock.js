(() => {
  // Basic visual gate only: this code is shipped to browsers and is not secure access control.
  const ACCESS_CODE = '523890';
  const SESSION_KEY = 'zaxProtectedSectionsUnlocked';
  const form = document.getElementById('section-access-form');
  const input = document.getElementById('section-access-code');
  const status = document.getElementById('section-access-status');
  const protectedContent = [...document.querySelectorAll('[data-section-content]')];
  const placeholders = [...document.querySelectorAll('[data-section-placeholder]')];
  const protectedNav = [...document.querySelectorAll('[data-protected-nav]')];
  const lockedNav = [...document.querySelectorAll('[data-locked-nav]')];
  const launcher = document.getElementById('assistantLauncher');

  function applyUnlocked(unlocked) {
    document.body.classList.toggle('sections-locked', !unlocked);
    protectedContent.forEach(node => { node.hidden = !unlocked; });
    placeholders.forEach(node => { node.hidden = unlocked; });
    protectedNav.forEach(node => { node.hidden = !unlocked; });
    lockedNav.forEach(node => { node.hidden = unlocked; });
    if (launcher) {
      launcher.hidden = !unlocked;
      launcher.setAttribute('aria-label', unlocked ? 'Open shop assistant' : 'Open protected sections');
    }
    window.refreshSectionDrawer?.();
  }

  let unlockedForTab = false;
  try { unlockedForTab = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (_) {}
  applyUnlocked(unlockedForTab);

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value.trim() !== ACCESS_CODE) {
      status.textContent = 'Incorrect access code. Please try again.';
      input.select();
      input.focus();
      return;
    }
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {}
    input.value = '';
    status.textContent = 'Access granted for this browser tab.';
    applyUnlocked(true);
  });

  input?.addEventListener('input', () => { status.textContent = ''; });
})();
