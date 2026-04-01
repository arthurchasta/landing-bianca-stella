document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initCounters();
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
