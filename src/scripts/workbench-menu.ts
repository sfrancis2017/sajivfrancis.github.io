// Owner Workbench menu, loaded on demand by Header.astro for an owner session
// only. Keeping the links here (a separate chunk) keeps them out of the HTML
// and scripts served to visitors.
const ownerLinks = [
  { href: 'https://docs.sajivfrancis.com/', label: 'Docs' },
  { href: 'https://chat.sajivfrancis.com/', label: 'Chat' },
  { href: 'https://cloud.sajivfrancis.com/', label: 'Cloud' },
  { href: 'https://trading.sajivfrancis.com/', label: 'Trading' },
  { href: '/news/', label: 'News' },
  { href: '/lab/ea-explorer/', label: 'Lab' },
  { href: '/tools/', label: 'Tools' },
];

export function buildWorkbench(closeMenu: () => void) {
  const chevron = (size: number, cls = '') =>
    `<svg ${cls ? `class="${cls}" ` : ''}width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  const desk = document.getElementById('workbench-desktop');
  if (desk) {
    desk.innerHTML =
      `<button type="button" class="no-underline hover:no-underline transition-colors inline-flex items-center gap-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]" aria-haspopup="true" aria-label="Open workbench menu (owner)">Workbench ${chevron(12)}</button>` +
      `<div class="utilities-popover absolute right-0 mt-2 min-w-[170px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-1 shadow-lg">` +
      ownerLinks
        .map(
          (l) =>
            `<a href="${l.href}" class="block px-3 py-2 no-underline hover:no-underline text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">${l.label}</a>`,
        )
        .join('') +
      `</div>`;
  }
  const mob = document.getElementById('workbench-mobile');
  if (mob) {
    mob.innerHTML =
      `<button type="button" id="mobile-workbench-toggle" aria-expanded="false" aria-controls="mobile-workbench-menu" class="w-full text-left py-3 no-underline hover:no-underline inline-flex items-center justify-between text-[var(--color-fg-muted)]"><span>Workbench</span>${chevron(16, 'mobile-group-icon')}</button>` +
      `<ul id="mobile-workbench-menu" class="hidden pl-3 pb-2">` +
      ownerLinks
        .map(
          (l) =>
            `<li><a href="${l.href}" class="block py-2 no-underline hover:no-underline text-sm text-[var(--color-fg-muted)]">${l.label}</a></li>`,
        )
        .join('') +
      `</ul>`;
    const wbToggle = mob.querySelector('#mobile-workbench-toggle');
    const wbMenu = mob.querySelector('#mobile-workbench-menu');
    wbToggle?.addEventListener('click', () => {
      const isOpen = wbToggle.getAttribute('aria-expanded') === 'true';
      wbToggle.setAttribute('aria-expanded', String(!isOpen));
      wbMenu?.classList.toggle('hidden', isOpen);
      wbToggle.querySelector('.mobile-group-icon')?.classList.toggle('rotate-180', !isOpen);
    });
    mob.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }
}
