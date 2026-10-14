// Pojišťuj chytře · mobilní menu, kalkulačka a odeslání formuláře
document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Kalkulačka úvěru
(function () {
  const slCastka = document.getElementById('sl-castka');
  if (!slCastka) return;
  const slDoba = document.getElementById('sl-doba');
  const slSazba = document.getElementById('sl-sazba');

  function fmt(n) {
    return n.toLocaleString('cs-CZ') + ' Kč';
  }
  function setFill(el) {
    const pct = ((+el.value - +el.min) / (+el.max - +el.min) * 100).toFixed(1);
    el.style.setProperty('--fill', pct + '%');
  }
  function calc() {
    const P = +slCastka.value;
    const n = +slDoba.value;
    const r = +slSazba.value / 100 / 12;
    const splatka = r < 0.0001 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const celkem = splatka * n;
    document.getElementById('out-castka').textContent = fmt(P);
    document.getElementById('out-doba').textContent = n + ' měsíců';
    document.getElementById('out-sazba').textContent = (+slSazba.value).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
    document.getElementById('res-splatka').textContent = fmt(Math.round(splatka));
    document.getElementById('res-celkem').textContent = fmt(Math.round(celkem));
    document.getElementById('res-preplatek').textContent = fmt(Math.round(celkem - P));
    setFill(slCastka);
    setFill(slDoba);
    setFill(slSazba);
  }
  [slCastka, slDoba, slSazba].forEach(function (el) { el.addEventListener('input', calc); });
  calc();
}());

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
