document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initCounters();
  initWhatsappTracking();
  initHeroEvento();
  initTestimonios();
});

/* ─── Navbar ─────────────────────────────────────────────────────────────── */

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const hasHero = document.querySelector('.hero, .page-hero');

  if (!hasHero) {
    navbar.classList.add('scrolled');
    return;
  }

  // Start transparent on hero pages
  navbar.classList.add('transparent');

  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.remove('transparent');
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('transparent');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─── Mobile menu ────────────────────────────────────────────────────────── */

function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-mobile');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close when any link inside the menu is clicked
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('active');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── Scroll animations ──────────────────────────────────────────────────── */

function initScrollAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const targets = document.querySelectorAll('.anim');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  targets.forEach(el => observer.observe(el));
}

/* ─── WhatsApp click tracking ────────────────────────────────────────────── */
// Mide el clic a WhatsApp (la conversión real del sitio). Antes el funnel
// estaba ciego: GTM/GA4 cargaban pero los botones wa.me no disparaban evento.
// Listener delegado: cubre todos los <a href="wa.me"> de todas las páginas.

function initWhatsappTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;
    trackWhatsapp(link.dataset.waSource || inferWaSource(link));
  });
}

function inferWaSource(link) {
  if (link.closest('.hero, .page-hero')) return 'hero';
  if (link.closest('.navbar, .nav-mobile')) return 'nav';
  if (link.closest('footer')) return 'footer';
  return 'body';
}

// Global: lo llaman también los handlers de formulario (window.open) inline.
function trackWhatsapp(source) {
  const path = window.location.pathname;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'click_whatsapp', wa_source: source, page_path: path });
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'click_whatsapp', { source: source, page_path: path });
  }
}

/* ─── Animated counters ──────────────────────────────────────────────────── */

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    counters.forEach(el => {
      el.textContent = el.dataset.count;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const targetString = el.dataset.count;   // e.g. "200+" or "50"
  const suffix = el.dataset.suffix || '';  // e.g. "+"
  const prefix = el.dataset.prefix || '';  // e.g. "$"

  // Extract numeric part (strip trailing non-digit characters)
  const numericMatch = targetString.match(/[\d.,]+/);
  if (!numericMatch) {
    el.textContent = targetString;
    return;
  }

  // Remove dots/commas for parsing, then parse
  const targetNum = parseFloat(numericMatch[0].replace(/[.,]/g, ''));
  if (isNaN(targetNum)) {
    el.textContent = targetString;
    return;
  }

  const duration = 1500; // ms
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(eased * targetNum);

    el.textContent = prefix + current.toLocaleString('es-CL') + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Set exact final string as specified in data-count
      el.textContent = prefix + targetString + (suffix && !targetString.endsWith(suffix) ? suffix : '');
    }
  }

  requestAnimationFrame(tick);
}

/* ─── Píldora de evento del hero ──────────────────────────────────────────
   Por defecto muestra el mensaje permanente. Si hay un evento vigente
   (data-evento-hasta), lo muestra hasta esa fecha y después vuelve solo al
   permanente. Así nunca queda una fecha pasada en el sitio.                */

function initHeroEvento() {
  document.querySelectorAll('.js-evento').forEach((el) => {
    const { eventoHasta, eventoHtml, eventoHref, eventoSource } = el.dataset;
    if (!eventoHasta || !eventoHtml || !eventoHref) return;
    const fin = Date.parse(eventoHasta);
    if (isNaN(fin) || Date.now() > fin) return;
    el.innerHTML = eventoHtml;
    el.href = eventoHref;
    el.classList.add('is-live');
    if (eventoSource) el.dataset.waSource = eventoSource;
  });
}

/* ─── Carrusel de testimonios ─────────────────────────────────────────────
   Una reseña a la vez: flechas, puntos, teclado y gesto táctil. Si el JS
   no corre, el track se queda en la primera y se lee igual.              */

function initTestimonios() {
  document.querySelectorAll('[data-carousel]').forEach((car) => {
    const track = car.querySelector('[data-track]');
    const slides = track ? Array.from(track.children).filter(el => el.classList.contains('t-slide')) : [];
    if (slides.length < 2) {
      car.querySelectorAll('.t-arrow').forEach(b => b.style.display = 'none');
      return;
    }

    const prev = car.querySelector('[data-prev]');
    const next = car.querySelector('[data-next]');
    const dotsBox = car.querySelector('[data-dots]');
    let i = 0;

    const dots = slides.map((_, n) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 't-dot';
      d.setAttribute('aria-label', 'Reseña ' + (n + 1));
      d.addEventListener('click', () => go(n));
      dotsBox && dotsBox.appendChild(d);
      return d;
    });

    function go(n) {
      i = Math.max(0, Math.min(n, slides.length - 1));
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }

    prev && prev.addEventListener('click', () => go(i - 1));
    next && next.addEventListener('click', () => go(i + 1));

    car.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(i - 1); }
      if (e.key === 'ArrowRight') { go(i + 1); }
    });

    // Gesto táctil
    let x0 = null;
    car.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    }, { passive: true });

    go(0);
  });
}

