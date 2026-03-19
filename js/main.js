/* ============================================
   Main JavaScript - GWC Website
   ============================================ */

// ============ Header Scroll Effect ============
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('header--scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ============ Mobile Menu ============
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header__nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('header__nav--open');
    document.body.style.overflow = nav.classList.contains('header__nav--open') ? 'hidden' : '';
  });

  // Close menu when clicking a link
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('header__nav--open');
      document.body.style.overflow = '';
    });
  });
}

// ============ Scroll To Top ============
function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('scroll-top--visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============ Counter Animation ============
function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
          current += step;
          if (current >= target) {
            el.textContent = target.toLocaleString() + (el.dataset.suffix || '');
            return;
          }
          el.textContent = Math.floor(current).toLocaleString() + (el.dataset.suffix || '');
          requestAnimationFrame(update);
        };

        update();
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ============ AOS - Simple Animate on Scroll ============
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.aosDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => {
    el.style.transitionDuration = (el.dataset.aosDuration || '600') + 'ms';
    el.style.transitionDelay = (el.dataset.aosDelay || '0') + 'ms';
    observer.observe(el);
  });
}

// ============ Lightbox ============
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
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox__close" aria-label="Close"><i class="fas fa-times"></i></button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
      <img class="lightbox__image" src="" alt="">
      <div class="lightbox__counter"></div>
      <div class="lightbox__caption"></div>
    `;
    document.body.appendChild(lightbox);
    this.el = lightbox;
  }

  bindEvents() {
    // Open lightbox
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

    // Close
    this.el.querySelector('.lightbox__close').addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });

    // Nav
    this.el.querySelector('.lightbox__nav--prev').addEventListener('click', () => this.prev());
    this.el.querySelector('.lightbox__nav--next').addEventListener('click', () => this.next());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Touch swipe
    let startX = 0;
    this.el.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
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
    const img = this.el.querySelector('.lightbox__image');
    const caption = this.el.querySelector('.lightbox__caption');
    const counter = this.el.querySelector('.lightbox__counter');

    img.src = item.dataset.lightbox || item.querySelector('img')?.src || item.src;
    caption.textContent = item.dataset.caption || '';
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.show();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.show();
  }
}

// ============ Gallery Tabs ============
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab, .media-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.closest('.gallery-tabs, .media-tabs');
      const targetClass = tab.closest('.gallery-tabs') ? 'gallery-tab' : 'media-tab';

      parent.querySelectorAll(`.${targetClass}`).forEach(t => t.classList.remove(`${targetClass}--active`));
      tab.classList.add(`${targetClass}--active`);

      const filter = tab.dataset.filter;
      const container = tab.closest('section').querySelector('.masonry-grid, .video-grid, .reels-grid, .media-content');

      if (container) {
        const items = container.querySelectorAll('[data-type]');
        items.forEach(item => {
          if (filter === 'all' || item.dataset.type === filter) {
            item.style.display = '';
            setTimeout(() => item.style.opacity = '1', 10);
          } else {
            item.style.opacity = '0';
            setTimeout(() => item.style.display = 'none', 300);
          }
        });
      }

      // Show/hide grid sections
      const sections = tab.closest('section').querySelectorAll('[data-media-section]');
      sections.forEach(s => {
        if (filter === 'all' || s.dataset.mediaSection === filter) {
          s.style.display = '';
        } else {
          s.style.display = 'none';
        }
      });
    });
  });
}

// ============ Events Filter ============
function initEventsFilter() {
  const filterSelects = document.querySelectorAll('.filter-select');
  const searchInput = document.querySelector('.filter-search__input');
  const cards = document.querySelectorAll('.event-story[data-country][data-year][data-type],.event-card[data-country][data-year][data-type]');
  if (!cards.length) return;

  function filterEvents() {
    const country = document.querySelector('[data-filter="country"]')?.value || 'all';
    const year = document.querySelector('[data-filter="year"]')?.value || 'all';
    const type = document.querySelector('[data-filter="type"]')?.value || 'all';
    const search = searchInput?.value?.toLowerCase() || '';

    let visibleCount = 0;
    cards.forEach(card => {
      const matchCountry = country === 'all' || card.dataset.country === country;
      const matchYear = year === 'all' || card.dataset.year === year;
      const matchType = type === 'all' || card.dataset.type === type;
      const matchSearch = !search || card.textContent.toLowerCase().includes(search);

      if (matchCountry && matchYear && matchType && matchSearch) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show no-results message
    const noResults = document.querySelector('.no-events-message');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  filterSelects.forEach(s => s.addEventListener('change', filterEvents));
  if (searchInput) searchInput.addEventListener('input', filterEvents);
}

// ============ Contact Form ============
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Simple validation
    const required = form.querySelectorAll('[required]');
    let valid = true;

    required.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--color-error)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) return;

    // Show success message
    const btn = form.querySelector('.btn');
    const originalText = btn.textContent;
    btn.textContent = i18n.t('form_success');
    btn.style.background = 'var(--color-success)';
    btn.style.color = '#fff';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
      form.reset();
    }, 3000);
  });
}

// ============ Smooth Anchor Scroll ============
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const pos = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    });
  });
}

// ============ Active Nav Link ============
function initActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });
}

// ============ Video Modal ============
function initVideoModal() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-video]');
    if (!trigger) return;

    e.preventDefault();
    const videoUrl = trigger.dataset.video;

    const modal = document.createElement('div');
    modal.className = 'lightbox lightbox--open';
    modal.style.cursor = 'pointer';
    modal.innerHTML = `
      <button class="lightbox__close"><i class="fas fa-times"></i></button>
      <div style="width:85vw;max-width:960px;aspect-ratio:16/9;">
        <iframe src="${videoUrl}" style="width:100%;height:100%;border:none;border-radius:var(--radius-md);"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const close = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    modal.querySelector('.lightbox__close').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handler);
      }
    });
  });
}

// ============ Parallax Effect (Hero) ============
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const particles = hero.querySelectorAll('.hero__particle');
    particles.forEach((p, i) => {
      const speed = 0.1 + (i * 0.05);
      p.style.transform = `translateY(${scrolled * speed}px)`;
    });
  }, { passive: true });
}

// ============ Initialize Everything ============
document.addEventListener('DOMContentLoaded', () => {
  // Core
  initHeader();
  initMobileMenu();
  initScrollTop();
  initSmoothScroll();
  initActiveNav();

  // Animations
  initAOS();
  animateCounters();
  initParallax();

  // Features
  const lightbox = new Lightbox();
  lightbox.init();

  initGalleryTabs();
  initEventsFilter();
  initContactForm();
  initVideoModal();

  // i18n
  if (window.i18n) {
    window.i18n.init();
  }
});
