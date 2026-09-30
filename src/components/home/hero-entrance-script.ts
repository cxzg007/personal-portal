// Runs before the hero's content is parsed, so hydration never hides a painted
// heading. Keep this a static, self-contained script with no interpolated data.
// CSS is visible by default and also settles without React or animation events.
export const HERO_ENTRANCE_SCRIPT = `(() => {
  const hero = document.currentScript?.closest('.profile-hero');
  if (!hero) return;
  let finish = () => {};
  try {
    const key = 'portal:hero-entrance:v1';
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, 'seen');
    const eligible = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    const navigation = window.performance.getEntriesByType('navigation')[0];
    if (!eligible.matches || document.hidden || window.location.hash || window.scrollY > 8 || navigation?.type === 'back_forward') return;
    if (document.referrer && new URL(document.referrer).origin === window.location.origin) return;

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
    fallback = window.setTimeout(finish, 1600);
    hero.dataset.heroEntrance = 'running';
  } catch {
    // Storage, APIs or inline execution may be restricted. Reading comes first.
    finish();
  }
})();`;
