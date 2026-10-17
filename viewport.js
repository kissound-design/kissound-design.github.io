/* The outer page owns the keyboard viewport; nested chats fill its iframe. */
(() => {
  'use strict';
  const root = document.documentElement;
  let embedded = false;
  try { embedded = parent !== window && parent.location.origin === location.origin; } catch {}
  if (!embedded) {
    root.classList.add('viewport-root');
    const viewport = window.visualViewport;
    let frame = 0;
    function update() {
      frame = 0;
      // Preserve user pinch zoom instead of treating it as a keyboard resize.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const height = viewport?.height || window.innerHeight;
      root.style.setProperty('--viewport-height', `${height}px`);
      root.style.setProperty('--viewport-top', `${viewport?.offsetTop || 0}px`);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    update();
  }
  const reply = document.querySelector('#reply');
  const messages = document.querySelector('#messages');
  if (!reply || !messages) return;
  function revealComposer() {
    if (document.activeElement !== reply) return;
    messages.scrollTo({top: messages.scrollHeight, behavior: 'instant'});
  }
  reply.addEventListener('focus', () => {
    document.body.classList.add('keyboard-open');
    requestAnimationFrame(revealComposer);
  });
  reply.addEventListener('blur', () => document.body.classList.remove('keyboard-open'));
  window.addEventListener('resize', revealComposer);
  window.visualViewport?.addEventListener('resize', revealComposer);
})();
