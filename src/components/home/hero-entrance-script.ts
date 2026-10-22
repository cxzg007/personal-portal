// Runs before the hero's content is parsed, so hydration never hides a painted
// heading. Keep this a static, self-contained script with no interpolated data.
// CSS is visible by default and also settles without React or animation events.
export const HERO_ENTRANCE_SCRIPT = `(() => {
  const hero = document.currentScript?.closest('.profile-hero');
  if (!hero) return;
  let finish = () => {};
  try {
    const key = 'portal:hero-entrance:v1';
    const navigation = window.performance.getEntriesByType('navigation')[0];
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const internal = referrer?.origin === window.location.origin;
    const fromRoom = internal && navigation?.type === 'navigate' &&
      ['/', '/experiments/henry/desktop/index.html', '/experiments/henry/room/index.html'].includes(referrer.pathname);
    // Learn-more is an explicit introduction; reloads and history keep their
    // existing state. The document link runs this bootstrap before first paint.
    if (window.sessionStorage.getItem(key) && !fromRoom) return;
    window.sessionStorage.setItem(key, 'seen');
    const eligible = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    if (!eligible.matches || document.hidden || window.location.hash || window.scrollY > 8 || navigation?.type === 'back_forward') return;
    if (internal && !fromRoom) return;

    const lifetime = new window.AbortController();
    const options = { passive: true, capture: true, signal: lifetime.signal };
    let fallback;
    finish = () => {
      hero.dataset.heroEntrance = 'complete';
      window.clearTimeout(fallback);
      lifetime.abort();
    };
    for (const event of ['pointerdown', 'keydown', 'focusin', 'wheel', 'scroll', 'hashchange', 'pagehide']) {
      window.addEventListener(event, finish, options);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
    eligible.addEventListener('change', finish, options);
    hero.addEventListener('animationend', (event) => {
      if (event.animationName === 'hero-entrance-rise' && event.target.hasAttribute('data-hero-entrance-last')) finish();
    }, options);
    fallback = window.setTimeout(finish, 2800);
    hero.dataset.heroEntrance = 'running';
  } catch {
    // Storage, APIs or inline execution may be restricted. Reading comes first.
    finish();
  }
})();`;
