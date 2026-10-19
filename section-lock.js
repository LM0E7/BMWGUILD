(() => {
  const protectedContent = [...document.querySelectorAll('[data-section-content]')];
  const protectedNav = [...document.querySelectorAll('[data-protected-nav]')];
  const launcher = document.getElementById('assistantLauncher');

  function applyLockedState() {
    document.body.classList.add('sections-locked');
    protectedContent.forEach(node => { node.hidden = true; });
    protectedNav.forEach(node => { node.hidden = true; });
    if (launcher) launcher.hidden = true;
    window.refreshSectionDrawer?.();
  }

  applyLockedState();
})();
