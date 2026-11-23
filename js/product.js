/* ============================================================
   SUPER JEWELLERS · PRODUCT DETAIL PAGE
   product.html?id=…  (catalogue se aata hai)
   ============================================================ */
(function () {
  'use strict';

  var store = window.SJ || {};
  var ui = window.SJ_UI || {};
  var $ = ui.$ || function (s) { return document.querySelector(s); };
  var $$ = ui.$$ || function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var escapeHtml = ui.escapeHtml || String;
  var formatPrice = ui.formatPrice || String;
  var fallbackImage = ui.fallbackImage || function () { return 'assets/royal-gold.jpg'; };

  var root = $('#product-root');
  if (!root) return;

  var params = new URLSearchParams(location.search);
  var id = params.get('id') || '';
  var p = store.getProduct ? store.getProduct(id) : null;

  function availabilityLabel(a) {
    var map = store.AVAILABILITY || {};
    return map[a] || 'Available';
  }

  if (!p || p.availability === 'hidden') {
    root.innerHTML =
      '<div class="section-wrap product-missing">' +
      '<p class="eyebrow">THE SUPER JEWELLERS COLLECTION</p>' +
      '<h1>Piece not <em>found.</em></h1>' +
      '<p class="policy-lead">This piece may have moved or been retired from the online catalogue. ' +
      'Browse the full collection, or message us — we will help you find it.</p>' +
      '<div class="hero-actions">' +
      '<a class="button button-gold" href="catalog.html">Browse catalogue <span>↗</span></a>' +
      '<a class="button button-ghost" data-whatsapp-general href="#">Ask on WhatsApp <span>↗</span></a>' +
      '</div></div>';
    if (window.SJ_UI) {
      var cfg = window.SJ_CONFIG || {};
      var wa = String((store.effectiveConfig ? store.effectiveConfig() : cfg).whatsappNumber || '').replace(/\D/g, '');
      if (wa) $$('[data-whatsapp-general]').forEach(function (el) {
        el.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hello Super Jewellers, I am looking for a piece from your catalogue. Please help.');
        el.target = '_blank'; el.rel = 'noopener';
      });
    }
    return;
  }

  var images = (p.images && p.images.length) ? p.images.slice() : [fallbackImage(p.category)];
  var cfg = (store.effectiveConfig ? store.effectiveConfig() : (window.SJ_CONFIG || {}));
  var wa = String(cfg.whatsappNumber || '').replace(/\D/g, '');

  var related = (store.getPublicProducts ? store.getPublicProducts() : [])
    .filter(function (x) { return x.id !== p.id && x.category === p.category; })
    .slice(0, 4);
  if (related.length < 4) {
    (store.getPublicProducts ? store.getPublicProducts() : []).forEach(function (x) {
      if (related.length < 4 && x.id !== p.id && related.indexOf(x) === -1 &&
        !related.some(function (r) { return r.id === x.id; })) related.push(x);
    });
  }

  var specRows = '';
  if (p.purity) specRows += '<div><span>PURITY</span><p>' + escapeHtml(p.purity) + '</p></div>';
  if (p.material) specRows += '<div><span>MATERIAL</span><p>' + escapeHtml(p.material) + '</p></div>';
  if (p.weight) specRows += '<div><span>WEIGHT</span><p>' + escapeHtml(p.weight) + '</p></div>';
  if (p.type) specRows += '<div><span>TYPE</span><p>' + escapeHtml(p.type) + '</p></div>';

  var waHref = wa
    ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(store.productMessage ? store.productMessage(p) : p.name)
    : (cfg.whatsappChannelUrl || '#');

  root.innerHTML =
    '<div class="section-wrap product-page">' +
    '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
    '<a href="index.html">Home</a> <span>/</span> <a href="catalog.html">Catalogue</a> ' +
    '<span>/</span> <a href="catalog.html?category=' + encodeURIComponent(p.category) + '">' + escapeHtml(p.category) + '</a> ' +
    '<span>/</span> <em>' + escapeHtml(p.name) + '</em></nav>' +

    '<div class="product-layout">' +
    '<div class="product-gallery" data-reveal>' +
    '<div class="product-main-image">' +
    '<img id="product-main-img" src="' + escapeHtml(images[0]) + '" alt="' + escapeHtml(p.name) + '" ' +
    'onerror="this.onerror=null;this.src=\'' + fallbackImage(p.category) + '\'">' +
    (p.availability !== 'available' ? '<span class="product-status status-' + escapeHtml(p.availability) + '">' + escapeHtml(availabilityLabel(p.availability)) + '</span>' : '') +
    '</div>' +
    (images.length > 1 ?
      '<div class="product-thumbs" role="tablist" aria-label="Product photographs">' +
      images.map(function (src, i) {
        return '<button type="button" class="product-thumb' + (i === 0 ? ' active' : '') + '" data-src="' + escapeHtml(src) + '" ' +
          'aria-label="Photograph ' + (i + 1) + '"><img src="' + escapeHtml(src) + '" alt=""></button>';
      }).join('') + '</div>' : '') +
    '</div>' +

    '<div class="product-summary" data-reveal>' +
    '<p class="eyebrow">' + escapeHtml(String(p.category).toUpperCase()) + ' · SUPER JEWELLERS</p>' +
    '<h1>' + escapeHtml(p.name) + '</h1>' +
    (p.code ? '<p class="product-detail-code">Product code · <b>' + escapeHtml(p.code) + '</b></p>' : '') +
    '<div class="product-detail-price">' + formatPrice(p.price) + '</div>' +
    '<p class="product-detail-desc">' + escapeHtml(p.description || 'Visit the showroom to view this piece and request full details.') + '</p>' +

    (specRows ? '<div class="product-specs">' + specRows + '</div>' : '') +

    '<p class="product-availability availability-' + escapeHtml(p.availability) + '">' +
    '<i></i> ' + escapeHtml(availabilityLabel(p.availability)) +
    (p.availability === 'reserved' ? ' — you can still enquire; the store will share similar designs.' : '') +
    '</p>' +

    '<div class="hero-actions product-actions">' +
    '<a class="button button-gold" href="reserve.html?product=' + encodeURIComponent(p.id) + '">Reserve this jewellery <span>↗</span></a>' +
    '<a class="button button-ghost" href="' + escapeHtml(waHref) + '" target="_blank" rel="noopener">Enquire on WhatsApp <span>↗</span></a>' +
    '</div>' +
    '<p class="product-fineprint">This is an in-store viewing reservation request — not an online purchase. ' +
    'The store confirms availability before your visit.</p>' +
    '</div></div>' +

    (related.length ?
      '<section class="related-section" data-reveal>' +
      '<div class="catalog-heading"><div><p class="eyebrow">YOU MAY ALSO LIKE</p>' +
      '<h2>Related <em>pieces.</em></h2></div></div>' +
      '<div class="product-grid" id="related-grid"></div></section>' : '') +
    '</div>';

  /* Gallery thumbs */
  var mainImg = $('#product-main-img');
  $$('.product-thumb').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.product-thumb').forEach(function (b) { b.classList.toggle('active', b === btn); });
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(function () {
          mainImg.src = btn.dataset.src;
          mainImg.style.opacity = '1';
        }, 160);
      }
    });
  });

  /* Related grid — reuse card markup from catalogue logic (lightweight copy) */
  var relatedGrid = $('#related-grid');
  if (relatedGrid && related.length) {
    relatedGrid.innerHTML = related.map(function (x, i) {
      var img = escapeHtml((x.images && x.images[0]) || fallbackImage(x.category));
      return '<article class="product-card" data-reveal data-reveal-stagger="' + (i % 4) + '">' +
        '<a class="product-card-link" href="product.html?id=' + encodeURIComponent(x.id) + '" aria-label="View ' + escapeHtml(x.name) + '">' +
        '<div class="product-photo"><img loading="lazy" src="' + img + '" alt="' + escapeHtml(x.name) + '" ' +
        'onerror="this.onerror=null;this.src=\'' + fallbackImage(x.category) + '\'">' +
        '<span class="product-open" aria-hidden="true">↗</span></div>' +
        '<div class="product-info"><span class="category-label">' + escapeHtml(x.type || x.category) + '</span>' +
        '<h3>' + escapeHtml(x.name) + '</h3>' +
        (x.code ? '<span class="product-code">' + escapeHtml(x.code) + '</span>' : '') +
        '<span class="product-price">' + formatPrice(x.price) + '</span></div></a></article>';
    }).join('');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
      }, { threshold: 0.08 });
      $$('.product-card', relatedGrid).forEach(function (el) { io.observe(el); });
    } else {
      $$('.product-card', relatedGrid).forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* Document title for SEO */
  document.title = p.name + (p.code ? ' (' + p.code + ')' : '') + ' — Super Jewellers Latur';
  var desc = document.querySelector('meta[name="description"]');
  if (desc && p.description) desc.setAttribute('content', p.description.slice(0, 155));
})();
