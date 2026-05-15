// ── SUPABASE CONFIGURATION ───────────────────────────
const SUPABASE_URL = 'https://ymxizpcknnmrigujpnpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteGl6cGNrbm5tcmlndWpwbnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Nzk1MzIsImV4cCI6MjA5NDM1NTUzMn0.2RKTkftK0-fFjHaAPRtUhPvCql04kkm4ExVFSwmRHyI';
const supabaseClient = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ── CURSOR ──────────────────────────────────────────────
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => { 
  cursor.style.left = e.clientX + 'px'; 
  cursor.style.top = e.clientY + 'px'; 
});
document.querySelectorAll('a,button,.service-card,.project-card').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.transform = 'translate(-50%,-50%) scale(2.5)'; cursor.style.opacity = '0.5'; });
  el.addEventListener('mouseleave', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; cursor.style.opacity = '1'; });
});

// ── NAV ──────────────────────────────────────────────────
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (nav) {
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 60); });
}
if (hamburger) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => mobileMenu.classList.remove('open')));

// ── HERO PARTICLE CANVAS ────────────────────────────────
const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.speedY = (Math.random() - 0.5) * 0.6;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.6 ? '#C8A96E' : 'rgba(245,240,232,0.6)';
    }
    update() {
      this.x += this.speedX; this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.save(); ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  for (let i = 0; i < 140; i++) particles.push(new Particle());
  function animParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.save(); ctx.globalAlpha = (1 - dist / 90) * 0.08; ctx.strokeStyle = '#C8A96E';
          ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); ctx.restore();
        }
      }
    }
    requestAnimationFrame(animParticles);
  }
  animParticles();
}

// ── HERO COUNTERS ────────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  let start = 0, step = target / (duration / 16);
  const t = setInterval(() => {
    start += step; if (start >= target) { start = target; clearInterval(t); }
    el.textContent = Math.floor(start);
  }, 16);
}
function initHeroCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    animateCounter(el, +el.dataset.target, 2000);
  });
}

// ── REVEAL ON SCROLL ────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal-up').forEach(el => obs.observe(el));
  initHeroCounters();
  initBigCounters();
}

// ── BIG STAT COUNTERS ───────────────────────────────────
function initBigCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target, +e.target.dataset.target, 2000); obs.unobserve(e.target); }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.counter, .glow-text[data-target]').forEach(el => obs.observe(el));
}

// ── REVIEWS SYSTEM ──────────────────────────────────────
const reviewForm = document.getElementById('add-review-form');
const reviewsTrack = document.getElementById('reviews-track');

const loadReviews = async () => {
  if (!reviewsTrack) return;
  reviewsTrack.innerHTML = '<p style="color:var(--gold); opacity:0.5; font-size:0.8rem;">Loading shared reviews...</p>';

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      reviewsTrack.innerHTML = '';
      data.forEach(rev => createReviewCard(rev, false));
      return;
    }
  }

  // Fallback to local
  const savedReviews = JSON.parse(localStorage.getItem('morphklik_reviews') || '[]');
  reviewsTrack.innerHTML = '';
  savedReviews.forEach(rev => createReviewCard(rev, false));
};

const createReviewCard = (data, isNew) => {
  const card = document.createElement('div');
  card.className = `review-card ${isNew ? 'new-item' : ''}`;
  const stars = '⭐'.repeat(parseInt(data.rating));
  card.innerHTML = `
    <div class="ric-icon">${stars}</div>
    <p class="review-card-text">"${data.text}"</p>
    <div class="review-card-meta">
      <strong>${data.name}</strong>
      <span>${data.role}</span>
    </div>
  `;
  if (isNew) {
    if (reviewsTrack) reviewsTrack.prepend(card);
  } else {
    if (reviewsTrack) reviewsTrack.appendChild(card);
  }
};

if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = reviewForm.querySelector('button');
    btn.innerText = 'POSTING...';
    btn.disabled = true;

    const newReview = {
      name: document.getElementById('review-name').value,
      role: document.getElementById('review-role').value,
      text: document.getElementById('review-text').value,
      rating: parseInt(document.getElementById('review-rating').value)
    };

    if (supabaseClient) {
      const { error } = await supabaseClient.from('reviews').insert([newReview]);
      if (error) {
        alert("Error saving review: " + error.message);
      } else {
        createReviewCard(newReview, true);
        reviewForm.reset();
      }
    } else {
      // Fallback to local if no Supabase (only for safety)
      const savedReviews = JSON.parse(localStorage.getItem('morphklik_reviews') || '[]');
      savedReviews.unshift({ ...newReview, id: Date.now() });
      localStorage.setItem('morphklik_reviews', JSON.stringify(savedReviews));
      createReviewCard(newReview, true);
      reviewForm.reset();
    }
    btn.innerText = 'Post Review';
    btn.disabled = false;
  });
}

// ── PORTFOLIO DYNAMIC SYSTEM ───────────────────────────
const getYoutubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/|\/live\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const DEFAULT_PROJECTS = {
  'video-production': [],
  'photography': [],
  'drone-shoots': [],
  'reels-shortform': [],
  'motion-graphics': [],
  'social-media-marketing': [],
  'web-developing': []
};

const initProjects = () => {
  // Logic removed to favor Supabase shared storage
};

const loadGallery = async (service) => {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  // Use defaults first, then fetch from Supabase
  let serviceProjects = [...(DEFAULT_PROJECTS[service] || [])];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('service', service)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Merge Supabase projects with defaults (Supabase first)
        serviceProjects = [...data, ...serviceProjects];
      }
    } catch (err) {
      console.warn("Supabase Fetch Failed:", err);
    }
  }

  grid.innerHTML = '';

  // Make short-form/reels cards smaller by increasing columns
  if (service === 'reels-shortform') {
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 280px))';
    grid.style.justifyContent = 'center';
  } else {
    grid.style.gridTemplateColumns = '';
  }

  serviceProjects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card reveal-up';
    card.dataset.media = p.media;
    
    // Check if it's a video
    const isYoutube = p.media.includes('youtube.com') || p.media.includes('youtu.be');
    const ytId = isYoutube ? getYoutubeId(p.media) : null;
    const isVimeo = p.media.includes('vimeo.com');
    const isInsta = p.media.includes('instagram.com');
    const isDirectVideo = p.media.match(/\.(mp4|webm|ogg)$/i);
    const isVideo = isYoutube || isVimeo || isDirectVideo || isInsta;

    // Use YouTube thumbnail if it's a YT video
    const thumbUrl = isYoutube && ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : p.media;

    if (service === 'reels-shortform') {
      card.style.aspectRatio = '9/16';
      card.style.maxHeight = '500px';
      card.style.width = 'fit-content';
      card.style.margin = '0 auto';
    }
    
    card.innerHTML = `
      <img src="${thumbUrl}" alt="${p.title}" class="project-img" onerror="this.src='images/logo1.png'; this.style.opacity='0.2';">
      <div class="play-btn" style="opacity: ${isVideo ? '1' : '0'}">▶</div>
      <div class="project-info">
        <h4>${p.title}</h4>
        <span>${p.role}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      const modal = document.getElementById('media-modal');
      if (!modal) return;
      const modalContent = modal.querySelector('.modal-content');
      
      let mediaHtml = '';
      let fallbackHtml = '';
      
      // Detection for local file protocol which blocks social embeds
      const isLocal = window.location.protocol === 'file:';
      if (isLocal) {
        if (isYoutube) {
          fallbackHtml = `<div style="text-align:center; padding:10px; color:#C8A96E; font-size:0.9rem;">⚠️ Running locally: If video doesn't load, <a href="${p.media}" target="_blank" style="color:#fff; text-decoration:underline;">Watch on YouTube</a></div>`;
        } else if (isInsta) {
          fallbackHtml = `<div style="text-align:center; padding:10px; color:#C8A96E; font-size:0.9rem;">⚠️ Running locally: If Instagram doesn't load, <a href="${p.media}" target="_blank" style="color:#fff; text-decoration:underline;">View on Instagram</a></div>`;
        }
      }

      if (isYoutube && ytId) {
        const isVertical = service === 'reels-shortform';
        mediaHtml = `<iframe class="modal-media ${isVertical ? 'vertical' : ''}" src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0&enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      } else if (isVimeo) {
        const vimeoId = p.media.split('/').pop();
        mediaHtml = `<iframe class="modal-media" src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      } else if (isInsta) {
        // Simple Instagram embed format
        const instaId = p.media.split('/').filter(Boolean).pop();
        mediaHtml = `<iframe class="modal-media" src="https://www.instagram.com/p/${instaId}/embed/" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`;
      } else if (isDirectVideo) {
        mediaHtml = `<video class="modal-media" src="${p.media}" controls autoplay></video>`;
      } else {
        mediaHtml = `<img src="${p.media}" alt="${p.title}" class="modal-media">`;
      }

      modalContent.innerHTML = `<span class="modal-close" id="modal-close">Close ✕</span>${fallbackHtml}${mediaHtml}`;
      modal.classList.add('open');
      
      document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.remove('open');
        modalContent.innerHTML = ''; // Stop video on close
      });
    });
    grid.appendChild(card);
  });
  if (typeof initReveal === 'function') initReveal();
};

// ── INIT ──────────────────────────────────────────────
const startApp = async () => {
  initReveal();
  initBigCounters();
  initProjects();
  loadReviews();
  const bodyId = document.body.dataset.service;
  if (bodyId) await loadGallery(bodyId);
};

// ── CONTACT FORM HANDLER ────────────────────────────
const initContactForm = () => {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = btn.innerText;
    btn.innerText = 'SENDING...';
    btn.disabled = true;

    // Get form values
    const name = document.getElementById('name').value;
    const brand = document.getElementById('brand').value || 'N/A';
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value || 'General Inquiry';
    const message = document.getElementById('message').value;

    try {
      // 1. Send Email via FormSubmit (AJAX) - Non-blocking
      const formData = new FormData(contactForm);
      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).catch(e => console.warn("Email service skip (normal for local testing):", e));

      // 2. Prepare WhatsApp URL
      const waText = `*New Inquiry for MorphKlik*%0A%0A` +
                     `*Name:* ${encodeURIComponent(name)}%0A` +
                     `*Brand:* ${encodeURIComponent(brand)}%0A` +
                     `*Phone:* ${encodeURIComponent(phone)}%0A` +
                     `*Service:* ${encodeURIComponent(service)}%0A` +
                     `*Message:* ${encodeURIComponent(message)}`;
      
      const waUrl = `https://wa.me/917276503081?text=${waText}`;

      // 3. Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      // 4. Show success message in UI
      const successMsg = document.getElementById('form-success');
      if (successMsg) {
        successMsg.classList.add('show');
        contactForm.style.opacity = '0.3';
        contactForm.style.pointerEvents = 'none';
      }
      
      contactForm.reset();
    } catch (err) {
      console.error("Form Error:", err);
      // Even if everything fails, try to open WhatsApp as a last resort
      const waUrl = `https://wa.me/917276503081?text=Hi, I tried to reach you via the website form.`;
      window.open(waUrl, '_blank');
    } finally {
      btn.innerText = originalBtnText;
      btn.disabled = false;
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startApp();
    initContactForm();
  });
} else {
  startApp();
  initContactForm();
}
