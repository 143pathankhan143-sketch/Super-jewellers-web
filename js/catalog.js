/* ============================================================
   SUPER JEWELLERS · CATALOGUE PAGE
   Search + category / type filters + product grid.
   ============================================================ */
(function () {
  'use strict';

  var store = window.SJ || {};
  var ui = window.SJ_UI || {};
  var $ = ui.$ || function (s) { return document.querySelector(s); };
  var $$ = ui.$$ || function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var escapeHtml = ui.escapeHtml || String;
  var formatPrice = ui.formatPrice || String;
  var primaryImage = ui.primaryImage || function () { return ''; };
  var fallbackImage = ui.fallbackImage || function () { return 'assets/royal-gold.jpg'; };

  var grid = $('#catalog-grid');
  var searchInput = $('#catalog-search');
  var categoryWrap = $('#catalog-categories');
  var typeSelect = $('#catalog-type');
  var countEl = $('#catalog-count');
  var noteEl = $('#catalog-note');
  if (!grid) return;

  var all = store.getPublicProducts ? store.getPublicProducts() : [];
  var categories = (window.SJ_CATEGORIES || ['Gold', 'Silver', 'Diamond', 'Bridal', 'Special']).slice();
  var types = (window.SJ_TYPES || []).slice();

  /* Derive categories/types actually present + keep the standard list. */
  var state = { q: '', category: 'All', type: 'All' };

  /* Read ?category= / ?search= from URL (collection tiles link here). */
  (function readParams() {
    var params = new URLSearchParams(location.search);
    var c = params.get('category');
    var q = params.get('search');
    if (c) state.category = c;
    if (q) state.q = q;
    if (searchInput && q) searchInput.value = q;
  })();

  function availabilityLabel(a) {
    var map = store.AVAILABILITY || {};
    return map[a] || 'Available';
  }

  function card(p, i) {
    var img = escapeHtml(primaryImage(p));
    var name = escapeHtml(p.name);
    var status = p.availability && p.availability !== 'available'
      ? '<span class="product-status status-' + escapeHtml(p.availability) + '">' + escapeHtml(availabilityLabel(p.availability)) + '</span>' : '';
    var badges = '';
    if (p.newArrival) badges += '<span class="product-flag flag-new">NEW</span>';
    if (p.featured) badges += '<span class="product-flag flag-featured">FEATURED</span>';
    return '<article class="product-card" data-reveal data-reveal-stagger="' + (i % 4) + '">' +
      '<a class="product-card-link" href="product.html?id=' + encodeURIComponent(p.id) + '" aria-label="View ' + name + '">' +
      '<div class="product-photo">' +
      '<img loading="lazy" decoding="async" src="' + img + '" alt="' + name + '" ' +
      'onerror="this.onerror=null;this.src=\'' + fallbackImage(p.category) + '\'">' +
      badges + status +
      '<span class="product-open" aria-hidden="true">↗</span></div>' +
      '<div class="product-info">' +
      '<span class="category-label">' + escapeHtml(p.type || p.category || 'Jewellery') + '</span>' +
      '<h3>' + name + '</h3>' +
      (p.code ? '<span class="product-code">' + escapeHtml(p.code) + '</span>' : '') +
      '<span class="product-price">' + formatPrice(p.price) + '</span>' +
      '</div></a></article>';
  }

  function matches(p) {
    if (state.category !== 'All' && p.category !== state.category) return false;
    if (state.type !== 'All' && p.type !== state.type) return false;
    if (state.q) {
      var hay = (p.name + ' ' + p.code + ' ' + p.category + ' ' + (p.type || '') + ' ' + (p.description || '')).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function render() {
    var list = all.filter(matches);
    if (countEl) {
      countEl.textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
    }
    if (noteEl) {
      noteEl.textContent = list.length
        ? 'Every piece is subject to availability. Confirm weight, purity and certification in store.'
        : '';
    }
    if (!all.length) {
      grid.innerHTML =
        '<div class="empty-state">Our online collection is being photographed in the showroom.' +
        '<br><small>Visit us at Bhande Galli, Latur — or call <a href="' + escapeHtml(store.telLink ? store.telLink() : '#') + '">' +
        escapeHtml(String((window.SJ_CONFIG || {}).businessPhone || '')) + '</a> to see today\'s designs.</small>' +
        '<br><a class="text-link" href="reserve.html">Reserve a viewing <span>↗</span></a> ' +
        '<a class="text-link" href="custom.html">Custom jewellery enquiry <span>↗</span></a></div>';
      return;
    }
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No pieces match that search.<br><small>Try another keyword, or call us — we may have it in the showroom.</small></div>';
      return;
    }
    grid.innerHTML = list.map(card).join('');
    /* Re-trigger reveal for freshly injected cards */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      $$('.product-card:not(.is-visible)', grid).forEach(function (el) { io.observe(el); });
    } else {
      $$('.product-card', grid).forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  function renderCategoryChips() {
    if (!categoryWrap) return;
    var present = {};
    all.forEach(function (p) { present[p.category] = true; });
    var list = ['All'].concat(categories.filter(function (c) { return present[c] || c === state.category; }));
    if (state.category !== 'All' && list.indexOf(state.category) === -1) list.push(state.category);
    categoryWrap.innerHTML = list.map(function (c) {
      return '<button type="button" class="category-tab' + (c === state.category ? ' active' : '') + '" ' +
        'data-category="' + escapeHtml(c) + '" aria-pressed="' + (c === state.category) + '">' +
        escapeHtml(c === 'All' ? 'All jewellery' : c) + '</button>';
    }).join('');
  }

  function renderTypeOptions() {
    if (!typeSelect) return;
    var present = {};
    all.forEach(function (p) { if (p.type) present[p.type] = true; });
    var opts = ['<option value="All">All types</option>'];
    types.forEach(function (t) {
      if (present[t]) opts.push('<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>');
    });
    typeSelect.innerHTML = opts.join('');
    if (state.type !== 'All') typeSelect.value = state.type;
  }

  if (categoryWrap) {
    categoryWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.category-tab');
      if (!btn) return;
      state.category = btn.dataset.category;
      $$('.category-tab', categoryWrap).forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render();
    });
  }
  if (typeSelect) {
    typeSelect.addEventListener('change', function () { state.type = typeSelect.value; render(); });
  }
  if (searchInput) {
    var t;
    searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = searchInput.value.trim(); render(); }, 140);
    });
    var form = searchInput.closest('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); state.q = searchInput.value.trim(); render(); });
  }

  renderCategoryChips();
  renderTypeOptions();
  render();
})();
