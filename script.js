/* ═══════════════════════════════════════════════════════
   SHYNE & JOSHUA — WEDDING INVITATION
   script.js — Cinematic Interactions
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   1. HERO CINEMATIC REVEAL (page load)
────────────────────────────────────────── */
(function initHeroReveal() {
  const reveals = document.querySelectorAll('.cinematic-reveal');
  reveals.forEach(el => {
    const delay = parseInt(el.dataset.delay) || 0;
    setTimeout(() => {
      el.classList.add('revealed');
    }, delay + 300); // +300 so page has painted
  });
})();


/* ──────────────────────────────────────────
   2. SCROLL PROGRESS BAR
────────────────────────────────────────── */
(function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  let ticking = false;
  const update = () => {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
    ticking = false;
  };
  // rAF throttle — prevents scroll handler firing faster than screen refresh (60fps cap)
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();


/* ──────────────────────────────────────────
   3. INTERSECTION OBSERVER — fade-scene
────────────────────────────────────────── */
(function initFadeScenes() {
  const targets = document.querySelectorAll('.fade-scene');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    // threshold: 0.08 — triggers earlier so animation is done by the time user sees it
    // rootMargin: removed negative bottom margin that was causing late triggers on mobile
    { threshold: 0.08, rootMargin: '0px 0px 0px 0px' }
  );
  targets.forEach(el => observer.observe(el));
})();


/* ──────────────────────────────────────────
   4. STORY LINE SEQUENTIAL REVEAL
────────────────────────────────────────── */
(function initStoryLines() {
  const lines = document.querySelectorAll('.story-line');
  if (!lines.length) return;

  const section = document.getElementById('scene-story');
  let triggered = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        lines.forEach((line, i) => {
          // 180ms gap between lines — snappier on mobile, still feels cinematic
          setTimeout(() => {
            line.classList.add('visible');
          }, i * 180);
        });
        observer.disconnect();
      }
    },
    // 0.1 threshold = triggers as soon as 10% of story section is visible
    { threshold: 0.1 }
  );

  if (section) observer.observe(section);
})();


/* ──────────────────────────────────────────
   5. COUNTDOWN TIMER
────────────────────────────────────────── */
(function initCountdown() {
  const WEDDING = new Date('2026-12-04T15:00:00+08:00'); // 3 PM PHT

  const cdDays  = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins  = document.getElementById('cd-mins');
  const cdSecs  = document.getElementById('cd-secs');

  if (!cdDays) return;

  function pad(n, len = 2) {
    return String(n).padStart(len, '0');
  }

  function tick() {
    const now  = new Date();
    const diff = WEDDING - now;

    if (diff <= 0) {
      cdDays.textContent  = '000';
      cdHours.textContent = '00';
      cdMins.textContent  = '00';
      cdSecs.textContent  = '00';
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    cdDays.textContent  = pad(days, 3);
    cdHours.textContent = pad(hours);
    cdMins.textContent  = pad(mins);
    cdSecs.textContent  = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ──────────────────────────────────────────
   6. PROPOSAL SLIDESHOW (auto + dots)
────────────────────────────────────────── */
(function initSlideshow() {
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');

  if (!slides.length) return;

  let current = 0;
  let timer   = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  function startAuto() { timer = setInterval(next, 4000); }
  function stopAuto()  { clearInterval(timer); }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      stopAuto();
      goTo(parseInt(dot.dataset.slide));
      startAuto();
    });
  });

  startAuto(); // 4 real proposal photos — auto-advances every 4s
})();


/* ──────────────────────────────────────────
   7. GUESTBOOK (localStorage)
────────────────────────────────────────── */
(function initGuestbook() {
  const nameInput    = document.getElementById('guestName');
  const msgInput     = document.getElementById('guestMessage');
  const submitBtn    = document.getElementById('guestSubmit');
  const entriesEl    = document.getElementById('guestbookEntries');
  const charCountEl  = document.getElementById('charCount');

  if (!submitBtn) return;

  const STORAGE_KEY = 'wedding_shyne_joshua_guestbook';

  // Load existing entries
  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderEntry(entry, prepend = false) {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <p class="entry-name">${escHtml(entry.name)}</p>
      <p class="entry-message">${escHtml(entry.message)}</p>
      <p class="entry-time">${formatTime(entry.ts)}</p>
    `;
    if (prepend) {
      entriesEl.insertBefore(div, entriesEl.firstChild);
    } else {
      entriesEl.appendChild(div);
    }
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Render all stored entries on load
  loadEntries().reverse().forEach(e => renderEntry(e));

  // Character counter
  if (msgInput && charCountEl) {
    msgInput.addEventListener('input', () => {
      charCountEl.textContent = `${msgInput.value.length} / 300`;
    });
  }

  // Submit
  submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const msg  = msgInput.value.trim();

    if (!name || !msg) {
      // Gentle shake
      [nameInput, msgInput].forEach(el => {
        if (!el.value.trim()) {
          el.style.borderColor = 'rgba(180, 120, 80, 0.6)';
          setTimeout(() => el.style.borderColor = '', 1200);
        }
      });
      return;
    }

    const entry = { name, message: msg, ts: new Date().toISOString() };
    const entries = loadEntries();
    entries.push(entry);
    saveEntries(entries);

    renderEntry(entry, true);

    nameInput.value = '';
    msgInput.value  = '';
    charCountEl.textContent = '0 / 300';

    // Confirm animation
    submitBtn.textContent = 'Message Sent ✦';
    submitBtn.style.borderColor = 'var(--gold-muted)';
    submitBtn.style.color = 'var(--gold-muted)';
    setTimeout(() => {
      submitBtn.textContent = 'Leave a Message';
      submitBtn.style.borderColor = '';
      submitBtn.style.color = '';
    }, 3000);
  });
})();


/* ──────────────────────────────────────────
   8. MUSIC TOGGLE
────────────────────────────────────────── */
(function initMusic() {
  const btn   = document.getElementById('musicBtn');
  const audio = document.getElementById('weddingAudio');
  const label = document.getElementById('musicIcon');

  if (!btn || !audio) return;

  let playing = false;

  // Attempt gentle volume ramp
  function fadeIn(audioEl) {
    audioEl.volume = 0;
    audioEl.play().catch(() => {});
    let v = 0;
    const ramp = setInterval(() => {
      v = Math.min(v + 0.05, 0.6);
      audioEl.volume = v;
      if (v >= 0.6) clearInterval(ramp);
    }, 80);
  }

  function fadeOut(audioEl) {
    let v = audioEl.volume;
    const ramp = setInterval(() => {
      v = Math.max(v - 0.05, 0);
      audioEl.volume = v;
      if (v <= 0) {
        clearInterval(ramp);
        audioEl.pause();
      }
    }, 80);
  }

  btn.addEventListener('click', () => {
    if (!playing) {
      fadeIn(audio);
      btn.classList.add('playing');
      label.textContent = '♬';
    } else {
      fadeOut(audio);
      btn.classList.remove('playing');
      label.textContent = '♪';
    }
    playing = !playing;
  });
})();


/* ──────────────────────────────────────────
   9. SMOOTH ANCHOR SCROLL (if needed)
────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
