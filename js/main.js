/* ============================================
   GWC — Main JavaScript v3.0
   Production-refined interactions
   ============================================ */

/* ── Header scroll with progress tracking ── */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('header--scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Mobile Menu ── */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header__nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('header__nav--open');
    toggle.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('header__nav--open');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll To Top ── */
function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('scroll-top--visible', window.scrollY > 500);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Counter Animation — eased, not linear ── */
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  // Ease-out quad for natural feel
  const easeOut = t => t * (2 - t);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        const duration = 2200;
        const start = performance.now();

        const update = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = easeOut(progress);
          const current = Math.floor(eased * target);

          el.textContent = current.toLocaleString() + suffix;

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = target.toLocaleString() + suffix;
          }
        };

        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
}

/* ── AOS — Scroll-triggered animations ── */
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.aosDelay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => {
    el.style.transitionDuration = (el.dataset.aosDuration || '700') + 'ms';
    observer.observe(el);
  });
}

/* ── Lightbox ── */
class Lightbox {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.el = null;
    this.isOpen = false;
  }

  init() {
    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Close"><i class="fas fa-times"></i></button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
      <img class="lightbox__image" src="" alt="">
      <div class="lightbox__counter"></div>
      <div class="lightbox__caption"></div>
    `;
    document.body.appendChild(lb);
    this.el = lb;
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-lightbox]');
      if (trigger) {
        e.preventDefault();
        const group = trigger.dataset.lightboxGroup || 'default';
        this.images = Array.from(document.querySelectorAll(`[data-lightbox][data-lightbox-group="${group}"]`));
        this.currentIndex = this.images.indexOf(trigger);
        this.open();
      }
    });

    this.el.querySelector('.lightbox__close').addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    this.el.querySelector('.lightbox__nav--prev').addEventListener('click', () => this.prev());
    this.el.querySelector('.lightbox__nav--next').addEventListener('click', () => this.next());

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    let startX = 0;
    this.el.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? this.next() : this.prev();
    }, { passive: true });
  }

  open() {
    this.isOpen = true;
    this.el.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
    this.show();
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  show() {
    const item = this.images[this.currentIndex];
    this.el.querySelector('.lightbox__image').src = item.dataset.lightbox || item.querySelector('img')?.src || '';
    this.el.querySelector('.lightbox__caption').textContent = item.dataset.caption || '';
    this.el.querySelector('.lightbox__counter').textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }

  prev() { this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length; this.show(); }
  next() { this.currentIndex = (this.currentIndex + 1) % this.images.length; this.show(); }
}

/* ── Gallery Tabs ── */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab, .media-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.closest('.gallery-tabs, .media-tabs');
      const cls = tab.closest('.gallery-tabs') ? 'gallery-tab' : 'media-tab';

      parent.querySelectorAll(`.${cls}`).forEach(t => t.classList.remove(`${cls}--active`));
      tab.classList.add(`${cls}--active`);

      const filter = tab.dataset.filter;
      const container = tab.closest('section').querySelector('.masonry-grid, .video-grid, .reels-grid');

      if (container) {
        container.querySelectorAll('[data-type]').forEach(item => {
          const show = filter === 'all' || item.dataset.type === filter;
          item.style.display = show ? '' : 'none';
        });
      }

      const sections = tab.closest('section').querySelectorAll('[data-media-section]');
      sections.forEach(s => {
        s.style.display = (filter === 'all' || s.dataset.mediaSection === filter) ? '' : 'none';
      });
    });
  });
}

/* ── Events Filter ── */
function initEventsFilter() {
  const filterSelects = document.querySelectorAll('.filter-select');
  const searchInput = document.querySelector('.filter-search__input');
  const cards = document.querySelectorAll('.event-story[data-country][data-year][data-type],.event-card[data-country][data-year][data-type],.ev-card[data-country][data-year][data-type]');
  if (!cards.length) return;

  function filterEvents() {
    const country = document.querySelector('[data-filter="country"]')?.value || 'all';
    const year = document.querySelector('[data-filter="year"]')?.value || 'all';
    const type = document.querySelector('[data-filter="type"]')?.value || 'all';
    const search = searchInput?.value?.toLowerCase() || '';

    let count = 0;
    cards.forEach(card => {
      const match = (country === 'all' || card.dataset.country === country)
        && (year === 'all' || card.dataset.year === year)
        && (type === 'all' || card.dataset.type === type)
        && (!search || card.textContent.toLowerCase().includes(search));

      card.style.display = match ? '' : 'none';
      if (match) count++;
    });

    const noResults = document.querySelector('.no-events-message');
    if (noResults) noResults.style.display = count === 0 ? 'block' : 'none';
  }

  filterSelects.forEach(s => s.addEventListener('change', filterEvents));
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(filterEvents, 200); // debounce
    });
  }
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = form.querySelectorAll('[required]');
    let valid = true;

    fields.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--error)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) return;

    const btn = form.querySelector('.btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ' + (window.i18n ? i18n.t('form_success') : 'Sent!');
    btn.style.background = 'var(--success)';
    btn.style.color = '#fff';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.pointerEvents = '';
      form.reset();
    }, 3000);
  });
}

/* ── Smooth Anchor Scroll ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    });
  });
}

/* ── Active Nav ── */
function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });
}

/* ── Video Modal ── */
function initVideoModal() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-video]');
    if (!trigger) return;
    e.preventDefault();

    const modal = document.createElement('div');
    modal.className = 'lightbox lightbox--open';
    modal.style.cursor = 'pointer';
    modal.innerHTML = `
      <button class="lightbox__close"><i class="fas fa-times"></i></button>
      <div style="width:min(88vw, 960px);aspect-ratio:16/9;">
        <iframe src="${trigger.dataset.video}" style="width:100%;height:100%;border:none;border-radius:var(--r-sm);"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const close = () => { modal.remove(); document.body.style.overflow = ''; };
    modal.querySelector('.lightbox__close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
    });
  });
}

/* ── Swiper Reels Slider ── */
function initReelsSwiper() {
  const reelsSwipers = document.querySelectorAll('.reels-swiper');
  if (!reelsSwipers.length || typeof Swiper === 'undefined') return;

  reelsSwipers.forEach(el => {
    new Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: 16,
      freeMode: true,
      grabCursor: true,
      speed: 500,
      breakpoints: {
        480:  { spaceBetween: 16 },
        768:  { spaceBetween: 18 },
        1024: { spaceBetween: 20 },
      },
    });
  });
}

/* ── Initialize ── */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollTop();
  initSmoothScroll();
  initActiveNav();
  initAOS();
  animateCounters();

  const lightbox = new Lightbox();
  lightbox.init();

  initGalleryTabs();
  initEventsFilter();
  initContactForm();
  initVideoModal();
  initReelsSwiper();

  if (window.i18n) window.i18n.init();
});
