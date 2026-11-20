(() => {
  // ===== CONFIG =====
  const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/JCVLFG6E2D';

  // ===== UTILS =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header
  const header = document.getElementById('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
  }));

  // Phone mask
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  // ===== FORM SUBMIT → CLOUDFLARE WORKER → TELEGRAM =====
  const form = document.getElementById('leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });

    if (payload._gotcha) return;

    if (!payload.name || (!payload.phone && !payload.contact)) {
      alert('Заполните имя и контактные данные');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    const tgText = 'Заявка с сайта. Имя: ' + payload.name + '. Контакт: ' + (payload.phone || payload.contact) + (payload.comment ? '. Запрос: ' + payload.comment : '');
    const tgLink = 'https://t.me/natasha2222?text=' + encodeURIComponent(tgText);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена ✓';
      form.querySelector('.form__fallback')?.remove();
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Заявка не ушла автоматически';
      form.querySelector('.form__fallback')?.remove();
      const note = document.createElement('p');
      note.className = 'form__agree form__fallback';
      note.innerHTML = 'Не получилось отправить заявку напрямую. Нажмите, чтобы отправить её в Telegram одним касанием: <a href="' + tgLink + '" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline;font-weight:600">отправить заявку в Telegram</a>. Текст уже готов, останется нажать «Отправить».';
      form.appendChild(note);
    } finally {
      clearTimeout(timer);
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Reveal on scroll
  const targets = document.querySelectorAll(
    '.adv, .srv, .step, .principle, .contact-card, .faq__item, .form, .hero__card, .about-wrap, .chips, .price-table-wrap, .pricing__note, .info-note'
  );
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => io.observe(el));
})();


// Цель Метрики «Заявка» (JavaScript-событие lead_submit)
document.getElementById('leadForm')?.addEventListener('submit', function () { if (window.ym) ym(114189886, 'reachGoal', 'lead_submit'); });
