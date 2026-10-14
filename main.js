// Pojišťuj chytře · mobilní menu a odeslání formuláře
document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Formulář se skutečně odesílá jen na ostré doméně. Jinde (náhled) rovnou ukáže děkovací stránku.
const LIVE = /(^|\.)pojistujchytre\.cz$/.test(location.hostname);

document.querySelectorAll('form.form').forEach((form) => {
  const started = form.querySelector('input[name="ts"]');
  if (started) started.value = String(Date.now());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const error = form.querySelector('.form-error');
    error.hidden = true;
    if (!LIVE) { location.href = 'dekujeme.html'; return; }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'send');
      location.href = 'dekujeme.html';
    } catch {
      error.hidden = false;
      button.disabled = false;
    }
  });
});
