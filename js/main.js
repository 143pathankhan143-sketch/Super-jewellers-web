/* ============================================================
   SUPER JEWELLERS · STOREFRONT SCRIPT (shared)
   Header, navigation, scroll reveals, WhatsApp float,
   business-info injection, homepage dynamic sections.
   ============================================================ */
(function () {
  'use strict';

  var store = window.SJ || {};
  var cfgRaw = window.SJ_CONFIG || {};
  var cfg = typeof store.effectiveConfig === 'function' ? store.effectiveConfig() : cfgRaw;
  var products = typeof store.getPublicProducts === 'function' ? store.getPublicProducts() : [];

  /* ---------- helpers ---------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatPrice(value) {
    var number = Number(value);
    if (!isFinite(number) || number <= 0) return 'Enquire for price';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR',
      maximumFractionDigits: number % 1 ? 2 : 0
    }).format(number);
  }

  function fallbackImage(category) {
    var key = String(category || '').toLowerCase();
    if (key.indexOf('silver') > -1) return 'assets/royal-silver.jpg';
    if (key.indexOf('diamond') > -1) return 'assets/royal-diamond.jpg';
    if (key.indexOf('bridal') > -1) return 'assets/royal-hero.jpg';
    return 'assets/royal-gold.jpg';
  }

  function primaryImage(p) {
    return (p.images && p.images[0]) || fallbackImage(p.category);
  }

  function availabilityLabel(a) {
    var map = (store.AVAILABILITY) || {};
    return map[a] || 'Available';
  }

  function toast(message) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  window.SJ_UI = {
    $: $, $$: $$, escapeHtml: escapeHtml, formatPrice: formatPrice,
    fallbackImage: fallbackImage, primaryImage: primaryImage,
    availabilityLabel: availabilityLabel, toast: toast
  };

  /* ---------- announcement bar ---------- */

  (function announcement() {
    var text = String(cfg.announcement || '').trim();
    if (!text) return;
    var bar = document.createElement('div');
    bar.className = 'announcement-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>' + escapeHtml(text) + '</span>';
    var header = $('.site-header');
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header);
  })();

  /* ---------- business details injection ---------- */

  function setBusinessInfo() {
    var phone = String(cfg.businessPhone || '').trim();
    var address = String(cfg.businessAddress || '').trim();
    var addressShort = String(cfg.businessAddressShort || cfg.businessAddress || '').trim();
    var hours = String(cfg.hoursDisplay || '').trim();
    var phoneHref = 'tel:' + phone.replace(/[^\d+]/g, '');

    $$('[data-business-address]').forEach(function (el) { if (address) el.textContent = address; });
    $$('[data-business-address-short], [data-footer-address]').forEach(function (el) { if (addressShort) el.textContent = addressShort; });

    $$('[data-business-phone-link], [data-footer-phone]').forEach(function (el) {
      if (!phone) { el.style.display = 'none'; return; }
      el.textContent = phone;
      el.href = phoneHref;
    });
    $$('[data-phone-text]').forEach(function (el) { if (phone) el.textContent = phone; });

    $$('[data-hours]').forEach(function (el) { if (hours) el.textContent = hours; });

    /* WhatsApp buttons */
    var wa = String(cfg.whatsappNumber || '').replace(/\D/g, '');
    $$('[data-whatsapp-general]').forEach(function (el) {
      if (wa) {
        el.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(
          'Hello Super Jewellers, I would like to know more about your collections. Please share details.');
        el.target = '_blank'; el.rel = 'noopener';
      } else if (cfg.whatsappChannelUrl) {
        el.href = cfg.whatsappChannelUrl; el.target = '_blank'; el.rel = 'noopener';
      }
    });

    $$('[data-social]').forEach(function (link) {
      var url = String(cfg[link.dataset.social + 'Url'] || '').trim();
      if (/^https:\/\//i.test(url)) { link.href = url; link.target = '_blank'; link.rel = 'noopener'; }
      else link.style.display = 'none';
    });

    [['[data-map-link]', 'mapsUrl'], ['[data-review-link]', 'reviewUrl'],
     ['[data-whatsapp-channel]', 'whatsappChannelUrl']].forEach(function (pair) {
      $$(pair[0]).forEach(function (link) {
        var url = String(cfg[pair[1]] || '').trim();
        if (/^https:\/\//i.test(url)) { link.href = url; link.target = '_blank'; link.rel = 'noopener'; }
        else link.style.display = 'none';
      });
    });

    /* Google rating chips */
    $$('[data-google-rating]').forEach(function (el) {
      el.textContent = String(cfg.googleRating || '') + ' / 5';
    });
    $$('[data-google-review-count]').forEach(function (el) {
      el.textContent = String(cfg.googleReviewCount || '') + ' Google reviews';
    });
  }

  /* ---------- header / navigation ---------- */

  var header = $('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', (window.scrollY || 0) > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var menuToggle = $('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function (event) {
      var nav = $('.main-nav');
      if (!nav) return;
      var open = nav.classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded', String(open));
      event.currentTarget.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }
  $$('.main-nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      var nav = $('.main-nav');
      if (nav) nav.classList.remove('open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* Active nav link by pathname */
  (function markActive() {
    var path = (location.pathname.split('/').pop() || 'index.html');
    if (path === '') path = 'index.html';
    $$('.main-nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0];
      if (href === path) a.classList.add('current');
    });
  })();

  /* ---------- scroll reveal (IntersectionObserver) ---------- */

  (function reveals() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el, i) {
      if (!el.style.getPropertyValue('--reveal-delay')) {
        var stagger = Number(el.dataset.revealStagger || 0);
        if (stagger) el.style.setProperty('--reveal-delay', (stagger * 70) + 'ms');
      }
      io.observe(el);
    });
  })();

  /* ---------- floating WhatsApp button ---------- */

  (function whatsappFloat() {
    if (document.body.classList.contains('admin-page')) return;
    if ($('.whatsapp-float')) return;
    var a = document.createElement('a');
    a.className = 'whatsapp-float';
    a.href = '#';
    a.setAttribute('aria-label', 'Chat with Super Jewellers on WhatsApp');
    a.innerHTML =
      '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="currentColor">' +
      '<path d="M16.04 4C9.43 4 4.07 9.36 4.07 15.97c0 2.11.55 4.17 1.6 5.99L4 28.5l6.7-1.75a11.9 11.9 0 0 0 5.34 1.28h.01c6.6 0 11.97-5.36 11.97-11.97C28.02 9.36 22.64 4 16.04 4zm0 21.85h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.98 1.04 1.06-3.88-.24-.4a9.87 9.87 0 0 1-1.51-5.26c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.56-.35z"/></svg>' +
      '<span>WhatsApp</span>';
    document.body.appendChild(a);

    var ready = function () {
      if (store.waNumber && store.waNumber()) {
        a.href = store.waLink(store.generalMessage ? store.generalMessage() : '');
        a.target = '_blank'; a.rel = 'noopener';
      } else if (cfg.whatsappChannelUrl) {
        a.href = cfg.whatsappChannelUrl; a.target = '_blank'; a.rel = 'noopener';
      } else {
        a.href = store.telLink ? store.telLink() : 'tel:' + String(cfg.businessPhone || '').replace(/[^\d+]/g, '');
      }
    };
    ready();
  })();

  /* ---------- homepage: dynamic product sections ---------- */

  function productCard(p, i) {
    var img = escapeHtml(typeof store.primaryImage === 'function' ? store.primaryImage(p) : fallbackImage(p.category));
    var name = escapeHtml(p.name);
    var status = p.availability && p.availability !== 'available'
      ? '<span class="product-status status-' + escapeHtml(p.availability) + '">' + escapeHtml(availabilityLabel(p.availability)) + '</span>' : '';
    var badges = '';
    if (p.newArrival) badges += '<span class="product-flag flag-new">NEW</span>';
    if (p.featured) badges += '<span class="product-flag flag-featured">FEATURED</span>';
    return '<article class="product-card" data-reveal data-reveal-stagger="' + (i % 4) + '" data-id="' + escapeHtml(p.id) + '">' +
      '<a class="product-card-link" href="product.html?id=' + encodeURIComponent(p.id) + '" aria-label="View ' + name + '">' +
      '<div class="product-photo">' +
      '<img loading="lazy" decoding="async" src="' + img + '" alt="' + name + '" ' +
      'onerror="this.onerror=null;this.src=\'' + fallbackImage(p.category) + '\'">' +
      badges + status +
      '<span class="product-open" aria-hidden="true">↗</span>' +
      '</div>' +
      '<div class="product-info">' +
      '<span class="category-label">' + escapeHtml(p.type || p.category || 'Jewellery') + '</span>' +
      '<h3>' + name + '</h3>' +
      (p.code ? '<span class="product-code">' + escapeHtml(p.code) + '</span>' : '') +
      '<span class="product-price">' + formatPrice(p.price) + '</span>' +
      '</div></a></article>';
  }

  function renderGrid(el, list, emptyHtml) {
    if (!el) return;
    if (!list.length) { el.innerHTML = emptyHtml || ''; return; }
    el.innerHTML = list.map(productCard).join('');
  }

  var homeEmpty =
    '<div class="empty-state">Our online collection is being photographed in the showroom.' +
    '<br><small>Visit us at ' + escapeHtml(String(cfg.businessAddressShort || 'Bhande Galli, Latur')) +
    ' — or call <a href="' + escapeHtml(store.telLink ? store.telLink() : '#') + '">' +
    escapeHtml(String(cfg.businessPhone || '')) + '</a> to see today\'s designs.</small>' +
    '<br><a class="text-link" href="catalog.html">Browse the catalogue <span>↗</span></a></div>';

  (function homeSections() {
    var featured = $('#featured-grid');
    var arrivals = $('#arrivals-grid');
    var popular = $('#popular-grid');
    var bridal = $('#bridal-grid');
    var catalogue = $('#home-catalog-grid');
    if (!featured && !arrivals && !popular && !bridal && !catalogue) return;

    if (!products.length) {
      [featured, arrivals, popular, bridal, catalogue].forEach(function (el) {
        if (el) {
          var wrap = el.closest('[data-dynamic-section]') || el.parentElement;
          if (wrap && wrap.hasAttribute('data-dynamic-section')) {
            if (!wrap.querySelector('.empty-state')) wrap.insertAdjacentHTML('beforeend', homeEmpty);
            el.remove();
          } else { el.innerHTML = homeEmpty; }
        }
      });
      var gridsWrap = $('#home-product-section');
      if (gridsWrap && !gridsWrap.querySelector('.empty-state')) {
        var h = gridsWrap.querySelector('[data-dynamic-title]');
        if (h) h.innerHTML = 'The collection, <em>coming to life.</em>';
      }
      return;
    }

    renderGrid(featured, products.filter(function (p) { return p.featured; }).slice(0, 8),
      '<div class="empty-state small">Featured pieces will appear here.<br><small>Ask in store for this week\'s highlights.</small></div>');
    renderGrid(arrivals, products.filter(function (p) { return p.newArrival; }).slice(0, 8),
      '<div class="empty-state small">No new arrivals listed yet.<br><small>Follow us on Instagram for fresh designs.</small></div>');
    renderGrid(popular, products.filter(function (p) { return p.popular || p.featured; }).slice(0, 8),
      '<div class="empty-state small">Popular pieces will appear here.</div>');
    renderGrid(bridal, products.filter(function (p) { return p.category === 'Bridal'; }).slice(0, 8),
      '<div class="empty-state small">Bridal pieces are being photographed.<br><small>Visit the showroom to view the bridal edit.</small></div>');
    renderGrid(catalogue, products.slice(0, 8), homeEmpty);
  })();

  /* ---------- homepage: testimonials + Google reviews ---------- */

  (function testimonials() {
    var wrap = $('#testimonial-grid');
    var list = Array.isArray(cfg.testimonials) ? cfg.testimonials : [];
    if (!wrap) return;
    if (!list.length) {
      var g = $('#google-reviews-cta');
      if (g) g.hidden = false;
      wrap.closest('[data-dynamic-section]') && wrap.closest('[data-dynamic-section]').classList.add('reviews-only');
      wrap.remove();
      return;
    }
    wrap.innerHTML = list.slice(0, 6).map(function (t, i) {
      return '<figure class="testimonial-card" data-reveal data-reveal-stagger="' + (i % 3) + '">' +
        '<div class="stars" aria-label="' + escapeHtml(String(t.rating || 5)) + ' out of 5">★★★★★</div>' +
        '<blockquote>' + escapeHtml(t.quote || '') + '</blockquote>' +
        '<figcaption>' + escapeHtml(t.name || 'Verified customer') + '</figcaption></figure>';
    }).join('');
  })();

  /* ---------- year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setBusinessInfo();
})();
