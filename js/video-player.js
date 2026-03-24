/* ============================================
   GWC — Video System v1.0
   Unified Player + Immersive Reels
   ============================================ */

/* ══════════════════════════════════════════════
   1. UNIFIED VIDEO MODAL
   Handles both YouTube embeds and local MP4
   ══════════════════════════════════════════════ */

class VideoModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
  }

  init() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-video]');
      if (!trigger) return;

      // Don't hijack if inside reels viewer
      if (trigger.closest('.reels-viewer')) return;

      e.preventDefault();
      e.stopPropagation();
      this.open(trigger.dataset.video, trigger.dataset.videoType || 'auto');
    });
  }

  /**
   * Detect video type from URL
   */
  detectType(src) {
    if (/youtube\.com|youtu\.be/.test(src)) return 'youtube';
    if (/vimeo\.com/.test(src)) return 'vimeo';
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) return 'local';
    return 'youtube'; // fallback
  }

  /**
   * Convert YouTube URL to embed URL
   */
  toEmbedUrl(src) {
    if (src.includes('/embed/')) return src;
    const match = src.match(/(?:v=|\.be\/|\/v\/)([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : src;
  }

  open(src, typeHint) {
    const type = typeHint === 'auto' ? this.detectType(src) : typeHint;

    this.modal = document.createElement('div');
    this.modal.className = 'vmodal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');

    if (type === 'local') {
      this.modal.innerHTML = this.buildLocalPlayer(src);
    } else {
      this.modal.innerHTML = this.buildIframePlayer(src, type);
    }

    document.body.appendChild(this.modal);
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Animate in
    requestAnimationFrame(() => this.modal.classList.add('vmodal--open'));

    this.bindModalEvents(type === 'local');
  }

  buildIframePlayer(src, type) {
    const embedSrc = type === 'youtube' ? this.toEmbedUrl(src) + '?autoplay=1&rel=0' : src;
    return `
      <button class="vmodal__close" aria-label="Close"><i class="fas fa-times"></i></button>
      <div class="vmodal__container">
        <div class="vmodal__player-wrap">
          <iframe src="${embedSrc}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen loading="lazy"></iframe>
        </div>
      </div>
    `;
  }

  buildLocalPlayer(src) {
    return `
      <button class="vmodal__close" aria-label="Close"><i class="fas fa-times"></i></button>
      <div class="vmodal__container">
        <div class="vmodal__player-wrap vmodal__player-wrap--local">
          <video class="vplayer__video" preload="metadata" playsinline>
            <source src="${src}" type="video/mp4">
          </video>
          <div class="vplayer__controls">
            <button class="vplayer__btn vplayer__play-btn" aria-label="Play"><i class="fas fa-play"></i></button>
            <div class="vplayer__progress">
              <div class="vplayer__progress-bar"></div>
              <div class="vplayer__progress-filled"></div>
            </div>
            <span class="vplayer__time">0:00</span>
            <button class="vplayer__btn vplayer__mute-btn" aria-label="Mute"><i class="fas fa-volume-up"></i></button>
            <button class="vplayer__btn vplayer__fs-btn" aria-label="Fullscreen"><i class="fas fa-expand"></i></button>
          </div>
          <div class="vplayer__overlay">
            <button class="vplayer__big-play" aria-label="Play"><i class="fas fa-play"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  bindModalEvents(isLocal) {
    const close = () => this.close();

    this.modal.querySelector('.vmodal__close').addEventListener('click', close);
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) close(); });

    const keyHandler = (e) => {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', keyHandler); }
    };
    document.addEventListener('keydown', keyHandler);

    if (isLocal) {
      this.initLocalControls();
    }
  }

  initLocalControls() {
    const wrap = this.modal.querySelector('.vmodal__player-wrap--local');
    if (!wrap) return;

    const video = wrap.querySelector('.vplayer__video');
    const playBtn = wrap.querySelector('.vplayer__play-btn');
    const bigPlay = wrap.querySelector('.vplayer__big-play');
    const muteBtn = wrap.querySelector('.vplayer__mute-btn');
    const fsBtn = wrap.querySelector('.vplayer__fs-btn');
    const progressBar = wrap.querySelector('.vplayer__progress');
    const progressFilled = wrap.querySelector('.vplayer__progress-filled');
    const timeDisplay = wrap.querySelector('.vplayer__time');
    const overlay = wrap.querySelector('.vplayer__overlay');

    const togglePlay = () => {
      if (video.paused) {
        video.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        overlay.classList.add('vplayer__overlay--hidden');
      } else {
        video.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        overlay.classList.remove('vplayer__overlay--hidden');
      }
    };

    const formatTime = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    playBtn.addEventListener('click', togglePlay);
    bigPlay.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    video.addEventListener('timeupdate', () => {
      const pct = (video.currentTime / video.duration) * 100;
      progressFilled.style.width = pct + '%';
      timeDisplay.textContent = formatTime(video.currentTime);
    });

    video.addEventListener('ended', () => {
      playBtn.innerHTML = '<i class="fas fa-redo"></i>';
      overlay.classList.remove('vplayer__overlay--hidden');
    });

    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const isRTL = document.documentElement.dir === 'rtl';
      const pct = isRTL
        ? (rect.right - e.clientX) / rect.width
        : (e.clientX - rect.left) / rect.width;
      video.currentTime = pct * video.duration;
    });

    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
    });

    fsBtn.addEventListener('click', () => {
      if (wrap.requestFullscreen) wrap.requestFullscreen();
      else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
    });

    // Autoplay
    video.play().catch(() => {});
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    overlay.classList.add('vplayer__overlay--hidden');
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('vmodal--open');
    setTimeout(() => {
      this.modal.remove();
      this.modal = null;
      document.body.style.overflow = '';
    }, 300);
    this.isOpen = false;
  }
}


/* ══════════════════════════════════════════════
   2. IMMERSIVE REELS VIEWER
   TikTok/Instagram-style vertical scroll experience
   ══════════════════════════════════════════════ */

class ReelsViewer {
  constructor() {
    this.viewer = null;
    this.reels = [];
    this.currentIndex = 0;
    this.isOpen = false;
    this.touchStartY = 0;
    this.isMuted = true;
  }

  init() {
    // Open reels viewer when clicking on a reel card
    document.addEventListener('click', (e) => {
      const reelCard = e.target.closest('.reel-card[data-reel]');
      if (!reelCard) return;
      e.preventDefault();
      e.stopPropagation();

      // Collect all reels in the same group
      const group = reelCard.dataset.reelGroup || 'default';
      this.reels = Array.from(document.querySelectorAll(`.reel-card[data-reel][data-reel-group="${group}"]`))
        .map(el => ({
          src: el.dataset.reel,
          type: el.dataset.reelType || 'local',
          poster: el.querySelector('img')?.src || '',
          title: el.querySelector('.reel-card__title')?.textContent || '',
          views: el.querySelector('.reel-card__views')?.textContent || '',
          tag: el.querySelector('.reel-card__tag')?.textContent || '',
        }));

      const allCards = document.querySelectorAll(`.reel-card[data-reel][data-reel-group="${group}"]`);
      this.currentIndex = Array.from(allCards).indexOf(reelCard);

      this.open();
    });
  }

  open() {
    this.viewer = document.createElement('div');
    this.viewer.className = 'reels-viewer';
    this.viewer.setAttribute('role', 'dialog');
    this.viewer.setAttribute('aria-modal', 'true');

    this.viewer.innerHTML = `
      <button class="reels-viewer__close" aria-label="Close"><i class="fas fa-times"></i></button>
      <button class="reels-viewer__mute" aria-label="Toggle sound"><i class="fas fa-volume-mute"></i></button>
      <div class="reels-viewer__nav reels-viewer__nav--up" aria-label="Previous"><i class="fas fa-chevron-up"></i></div>
      <div class="reels-viewer__nav reels-viewer__nav--down" aria-label="Next"><i class="fas fa-chevron-down"></i></div>
      <div class="reels-viewer__counter"></div>
      <div class="reels-viewer__track"></div>
    `;

    document.body.appendChild(this.viewer);
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    requestAnimationFrame(() => this.viewer.classList.add('reels-viewer--open'));

    this.renderReels();
    this.bindEvents();
    this.goTo(this.currentIndex, false);
  }

  renderReels() {
    const track = this.viewer.querySelector('.reels-viewer__track');

    this.reels.forEach((reel, i) => {
      const slide = document.createElement('div');
      slide.className = 'reels-viewer__slide';
      slide.dataset.index = i;

      slide.innerHTML = `
        <div class="reels-viewer__media">
          <img class="reels-viewer__poster" src="${reel.poster}" alt="" loading="lazy">
          <div class="reels-viewer__loader"><div class="reels-viewer__spinner"></div></div>
        </div>
        <div class="reels-viewer__overlay">
          <div class="reels-viewer__play-toggle"><i class="fas fa-play"></i></div>
        </div>
        <div class="reels-viewer__info">
          ${reel.tag ? `<span class="reels-viewer__tag">${reel.tag}</span>` : ''}
          <span class="reels-viewer__title">${reel.title}</span>
          ${reel.views ? `<span class="reels-viewer__views">${reel.views}</span>` : ''}
        </div>
        <div class="reels-viewer__progress"><div class="reels-viewer__progress-bar"></div></div>
      `;

      track.appendChild(slide);
    });
  }

  bindEvents() {
    // Close
    this.viewer.querySelector('.reels-viewer__close').addEventListener('click', () => this.close());

    // Mute toggle
    this.viewer.querySelector('.reels-viewer__mute').addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      this.viewer.querySelector('.reels-viewer__mute i').className =
        this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';

      const video = this.getCurrentSlide()?.querySelector('video');
      if (video) video.muted = this.isMuted;
    });

    // Nav arrows
    this.viewer.querySelector('.reels-viewer__nav--up').addEventListener('click', () => this.prev());
    this.viewer.querySelector('.reels-viewer__nav--down').addEventListener('click', () => this.next());

    // Keyboard
    const keyHandler = (e) => {
      if (!this.isOpen) return;
      switch (e.key) {
        case 'Escape': this.close(); break;
        case 'ArrowUp': e.preventDefault(); this.prev(); break;
        case 'ArrowDown': e.preventDefault(); this.next(); break;
        case ' ': e.preventDefault(); this.togglePlay(); break;
        case 'm': case 'M': this.viewer.querySelector('.reels-viewer__mute').click(); break;
      }
    };
    document.addEventListener('keydown', keyHandler);
    this._keyHandler = keyHandler;

    // Mouse wheel
    let wheelTimeout;
    this.viewer.addEventListener('wheel', (e) => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 30) this.next();
        else if (e.deltaY < -30) this.prev();
      }, 80);
    }, { passive: false });

    // Touch swipe
    this.viewer.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.viewer.addEventListener('touchend', (e) => {
      const diff = this.touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) {
        if (diff > 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Click to play/pause
    this.viewer.querySelector('.reels-viewer__track').addEventListener('click', (e) => {
      if (e.target.closest('.reels-viewer__info') || e.target.closest('button')) return;
      this.togglePlay();
    });
  }

  getCurrentSlide() {
    return this.viewer?.querySelector(`.reels-viewer__slide[data-index="${this.currentIndex}"]`);
  }

  goTo(index, animate = true) {
    if (index < 0 || index >= this.reels.length) return;

    // Pause previous
    this.pauseCurrent();

    this.currentIndex = index;
    const track = this.viewer.querySelector('.reels-viewer__track');

    track.style.transition = animate ? 'transform .4s cubic-bezier(.16,1,.3,1)' : 'none';
    track.style.transform = `translateY(-${index * 100}%)`;

    // Update counter
    this.viewer.querySelector('.reels-viewer__counter').textContent =
      `${index + 1} / ${this.reels.length}`;

    // Update nav visibility
    this.viewer.querySelector('.reels-viewer__nav--up').style.opacity = index === 0 ? '.2' : '1';
    this.viewer.querySelector('.reels-viewer__nav--down').style.opacity =
      index === this.reels.length - 1 ? '.2' : '1';

    // Load and play current
    setTimeout(() => this.loadAndPlay(index), animate ? 300 : 50);
  }

  loadAndPlay(index) {
    const slide = this.viewer.querySelector(`.reels-viewer__slide[data-index="${index}"]`);
    if (!slide) return;

    const reel = this.reels[index];
    const mediaWrap = slide.querySelector('.reels-viewer__media');

    // Already loaded?
    if (mediaWrap.querySelector('video')) {
      const video = mediaWrap.querySelector('video');
      video.currentTime = 0;
      video.muted = this.isMuted;
      video.play().catch(() => {});
      slide.querySelector('.reels-viewer__overlay').classList.add('reels-viewer__overlay--playing');
      this.trackProgress(video, slide);
      return;
    }

    // Create video element
    const video = document.createElement('video');
    video.className = 'reels-viewer__video';
    video.playsInline = true;
    video.loop = true;
    video.muted = this.isMuted;
    video.preload = 'metadata';
    video.setAttribute('playsinline', '');

    if (reel.type === 'youtube') {
      // For YouTube, use poster with play button → opens iframe
      slide.querySelector('.reels-viewer__loader').remove();
      return;
    }

    video.src = reel.src;
    video.poster = reel.poster;
    mediaWrap.appendChild(video);

    video.addEventListener('canplay', () => {
      slide.querySelector('.reels-viewer__loader')?.remove();
      slide.querySelector('.reels-viewer__poster')?.remove();
      video.play().catch(() => {});
      slide.querySelector('.reels-viewer__overlay').classList.add('reels-viewer__overlay--playing');
    }, { once: true });

    this.trackProgress(video, slide);
  }

  trackProgress(video, slide) {
    const bar = slide.querySelector('.reels-viewer__progress-bar');
    if (!bar) return;

    const update = () => {
      if (!this.isOpen) return;
      if (video.duration) {
        bar.style.width = (video.currentTime / video.duration * 100) + '%';
      }
      requestAnimationFrame(update);
    };
    update();
  }

  pauseCurrent() {
    const slide = this.getCurrentSlide();
    if (!slide) return;

    const video = slide.querySelector('video');
    if (video) video.pause();
    slide.querySelector('.reels-viewer__overlay')?.classList.remove('reels-viewer__overlay--playing');
  }

  togglePlay() {
    const slide = this.getCurrentSlide();
    if (!slide) return;

    const video = slide.querySelector('video');
    if (!video) return;

    if (video.paused) {
      video.play();
      slide.querySelector('.reels-viewer__overlay').classList.add('reels-viewer__overlay--playing');
    } else {
      video.pause();
      slide.querySelector('.reels-viewer__overlay').classList.remove('reels-viewer__overlay--playing');
    }
  }

  next() { this.goTo(this.currentIndex + 1); }
  prev() { this.goTo(this.currentIndex - 1); }

  close() {
    this.pauseCurrent();
    this.viewer.classList.remove('reels-viewer--open');
    document.removeEventListener('keydown', this._keyHandler);

    setTimeout(() => {
      this.viewer.remove();
      this.viewer = null;
      document.body.style.overflow = '';
    }, 300);
    this.isOpen = false;
  }
}


/* ══════════════════════════════════════════════
   3. INITIALIZATION
   ══════════════════════════════════════════════ */

// Expose classes globally for fallback detection
window.VideoModal = VideoModal;
window.ReelsViewer = ReelsViewer;

document.addEventListener('DOMContentLoaded', () => {
  // Unified video modal (replaces old initVideoModal)
  const videoModal = new VideoModal();
  videoModal.init();

  // Immersive reels viewer
  const reelsViewer = new ReelsViewer();
  reelsViewer.init();
});
