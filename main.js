// Pojistuj chytre - mobilni menu, kalkulacka a odeslani formulare
document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Kalkulacka uveru v2
(function () {
  if (!document.getElementById('tab-pay')) return;

  const fmt = (n) => Math.round(n).toLocaleString('cs-CZ') + ' Kč';
  function annuity(P, rAnnual, years) {
    if (!(P > 0) || !(years > 0)) return 0;
    const n = Math.round(years * 12);
    const i = rAnnual / 100 / 12;
    if (i <= 0) return P / n;
    return P * i / (1 - Math.pow(1 + i, -n));
  }
  function setFill(slider) {
    const pct = ((+slider.value - +slider.min) / (+slider.max - +slider.min) * 100).toFixed(1);
    slider.style.setProperty('--fill', pct + '%');
  }
  function syncPair(numInput, slider) {
    numInput.addEventListener('input', () => {
      const clamped = Math.min(+slider.max, Math.max(+slider.min, +numInput.value));
      slider.value = clamped;
      setFill(slider);
      recalc();
    });
    slider.addEventListener('input', () => {
      numInput.value = slider.value;
      setFill(slider);
      recalc();
    });
    setFill(slider);
  }

  // Panel 1 - splatka
  const inAmount = document.getElementById('c-amount'), slAmount = document.getElementById('sl-amount');
  const inRate   = document.getElementById('c-rate'),   slRate   = document.getElementById('sl-rate');
  const inYears  = document.getElementById('c-years'),  slYears  = document.getElementById('sl-years');
  syncPair(inAmount, slAmount);
  syncPair(inRate,   slRate);
  syncPair(inYears,  slYears);

  function calcPay() {
    const P = +inAmount.value, R = +inRate.value, Y = +inYears.value;
    const n = Math.round(Y * 12);
    const m = annuity(P, R, Y);
    const total = m * n;
    const interest = Math.max(0, total - P);
    const pct = total > 0 ? Math.min(100, Math.round(P / total * 100)) : 100;
    document.getElementById('res-pay').textContent      = fmt(m);
    document.getElementById('res-total').textContent    = fmt(total);
    document.getElementById('res-interest').textContent = fmt(interest);
    document.getElementById('res-bar').style.width      = pct + '%';
  }

  // Panel 2 - porovnani sazeb
  const inBal = document.getElementById('c-bal'), slBal = document.getElementById('sl-bal');
  const inRem = document.getElementById('c-rem'), slRem = document.getElementById('sl-rem');
  const inR1  = document.getElementById('c-r1'),  slR1  = document.getElementById('sl-r1');
  const inR2  = document.getElementById('c-r2'),  slR2  = document.getElementById('sl-r2');
  syncPair(inBal, slBal);
  syncPair(inRem, slRem);
  syncPair(inR1,  slR1);
  syncPair(inR2,  slR2);

  function calcCmp() {
    const B = +inBal.value, rem = +inRem.value, r1 = +inR1.value, r2 = +inR2.value;
    const n = Math.round(rem * 12);
    const p1 = annuity(B, r1, rem), p2 = annuity(B, r2, rem);
    const d = p1 - p2;
    document.getElementById('res-pay1').textContent       = fmt(p1);
    document.getElementById('res-pay2').textContent       = fmt(p2);
    document.getElementById('res-diff-month').textContent = fmt(Math.abs(d));
    document.getElementById('res-diff-total').textContent = fmt(Math.abs(d) * n);
    let verdict;
    if (Math.round(d) > 0) verdict = 'S nové sazbě byste platili o ' + fmt(d) + ' měsíčně méně.';
    else if (Math.round(d) < 0) verdict = 'S nové sazbě byste platili o ' + fmt(-d) + ' měsíčně víc.';
    else verdict = 'Splátka by zůstala stejná.';
    document.getElementById('res-verdict').textContent = verdict;
  }

  const mode = { current: 'pay' };
  function recalc() { mode.current === 'pay' ? calcPay() : calcCmp(); }

  document.getElementById('tab-pay').addEventListener('click', function () {
    mode.current = 'pay';
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('tab-cmp').setAttribute('aria-pressed', 'false');
    document.getElementById('panel-pay').hidden = false;
    document.getElementById('panel-cmp').hidden = true;
    calcPay();
  });
  document.getElementById('tab-cmp').addEventListener('click', function () {
    mode.current = 'cmp';
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('tab-pay').setAttribute('aria-pressed', 'false');
    document.getElementById('panel-cmp').hidden = false;
    document.getElementById('panel-pay').hidden = true;
    calcCmp();
  });

  calcPay();
}());

// Formular se skutecne odesila jen na ostre domene. Jinde (nahled) rovnou ukaze dekovaci stranku.
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
