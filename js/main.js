/* ============================================================
   SUPER JEWELLERS · STOREFRONT SCRIPT
   Pure static site — no backend, no login, no third-party API.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.SJ_CONFIG || {};
  var products = (Array.isArray(window.SJ_PRODUCTS) ? window.SJ_PRODUCTS : []).filter(function (p) {
    return p && p.name;
  });

  var grid = document.querySelector('#product-grid');
  var dialog = document.querySelector('#product-dialog');
  var tabsWrap = document.querySelector('#category-tabs');
  var note = document.querySelector('#catalog-note');
  var activeCategory = 'All';
  var phoneDigits = String(cfg.businessPhone || '').replace(/[^\d+]/g, '');
  var waDigits = String(cfg.whatsappNumber || '').replace(/\D/g, '');

  /* ---------- helpers ---------- */

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

  function safeImage(path, category) {
    return path ? path : fallbackImage(category);
  }

  function enquiryUrl(product) {
    var message = 'Hello Super Jewellers, I would like to enquire about ' + product.name +
      (Number(product.price) > 0 ? ' (' + formatPrice(product.price) + ')' : '') + '.';
    if (waDigits) return 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(message);
    if (cfg.whatsappChannelUrl) return cfg.whatsappChannelUrl;
    return 'tel:' + phoneDigits;
  }

  function enquiryLabel() {
    return waDigits ? 'Enquire on WhatsApp' : 'Ask on WhatsApp channel';
  }

  /* ---------- catalogue ---------- */

  function renderProducts() {
    if (!grid) return;

    if (!products.length) {
      grid.innerHTML =
        '<div class="empty-state">Our online collection is being photographed in the showroom.' +
        '<br><small>Visit us at Bhande Gallee, Latur — or call ' +
        '<a href="tel:' + escapeHtml(phoneDigits) + '">' + escapeHtml(cfg.businessPhone || '') + '</a>' +
        ' to see today\'s designs.</small></div>';
      if (note) note.textContent = '';
      return;
    }

    var list = activeCategory === 'All'
      ? products
      : products.filter(function (p) { return String(p.category) === activeCategory; });

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No pieces in this collection right now.<br><small>Please check the other collections, or call us.</small></div>';
      return;
    }

    grid.innerHTML = list.map(function (p, index) {
      var image = escapeHtml(safeImage(p.image, p.category));
      var name = escapeHtml(p.name);
      return '<article class="product-card" tabindex="0" data-index="' + index + '" aria-label="View ' + name + ' details">' +
        '<div class="product-photo">' +
        '<img loading="lazy" decoding="async" src="' + image + '" alt="' + name + '" onerror="this.onerror=null;this.src=\'' + fallbackImage(p.category) + '\'">' +
        '<span class="product-badge">' + escapeHtml(p.category || 'Jewellery') + '</span>' +
        '<button class="product-open" aria-label="View ' + name + ' details">↗</button>' +
        '</div>' +
        '<div class="product-info">' +
        '<span class="category-label">' + escapeHtml(p.category || 'Jewellery') + '</span>' +
        '<h3>' + name + '</h3>' +
        '<p>' + escapeHtml(p.description || '') + '</p>' +
        '<span class="product-price">' + formatPrice(p.price) + '</span>' +
        '<a class="product-enquire" href="' + escapeHtml(enquiryUrl(p)) + '" target="_blank" rel="noopener">' + enquiryLabel() + ' <span>↗</span></a>' +
        '</div></article>';
    }).join('');

    Array.prototype.forEach.call(grid.querySelectorAll('.product-card'), function (card) {
      var item = list[Number(card.dataset.index)];
      function open() { openProduct(item); }
      card.addEventListener('click', function (event) {
        if (event.target.closest('.product-enquire')) return;
        open();
      });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });

    if (note) note.textContent = 'Every piece is subject to availability. Confirm weight, purity and certification in store.';
  }

  function renderTabs() {
    if (!tabsWrap) return;
    var categories = [];
    products.forEach(function (p) {
      if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
    });
    if (categories.length < 2) { tabsWrap.hidden = true; return; }

    tabsWrap.hidden = false;
    tabsWrap.innerHTML = [['All', 'The full edit']].concat(categories.map(function (c) { return [c, c]; }))
      .map(function (pair, i) {
        return '<button class="category-tab' + (i === 0 ? ' active' : '') + '" data-category="' + escapeHtml(pair[0]) + '" role="tab" aria-selected="' + (i === 0) + '">' + escapeHtml(pair[1]) + '</button>';
      }).join('');

    tabsWrap.addEventListener('click', function (event) {
      var button = event.target.closest('.category-tab');
      if (!button) return;
      Array.prototype.forEach.call(tabsWrap.querySelectorAll('.category-tab'), function (b) {
        b.classList.toggle('active', b === button);
        b.setAttribute('aria-selected', String(b === button));
      });
      activeCategory = button.dataset.category;
      renderProducts();
    });
  }

  function openProduct(product) {
    if (!product || !dialog) return;
    var content = document.querySelector('#dialog-content');
    if (!content) return;
    var image = escapeHtml(safeImage(product.image, product.category));
    content.innerHTML = '<div class="dialog-product">' +
      '<img src="' + image + '" alt="' + escapeHtml(product.name) + '">' +
      '<div class="dialog-product-copy">' +
      '<p class="eyebrow">' + escapeHtml(String(product.category || 'Jewellery').toUpperCase()) + ' · SUPER JEWELLERS</p>' +
      '<h2>' + escapeHtml(product.name) + '</h2>' +
      '<p>' + escapeHtml(product.description || '') + '</p>' +
      '<div class="dialog-price">' + formatPrice(product.price) + '</div>' +
      '<a class="button button-dark" href="' + escapeHtml(enquiryUrl(product)) + '" target="_blank" rel="noopener">' + enquiryLabel() + ' <span>↗</span></a>' +
      '</div></div>';
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  /* ---------- navigation & chrome ---------- */

  var menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function (event) {
      var nav = document.querySelector('.main-nav');
      if (!nav) return;
      var open = nav.classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded', String(open));
      event.currentTarget.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.main-nav a'), function (a) {
    a.addEventListener('click', function () {
      var nav = document.querySelector('.main-nav');
      if (nav) nav.classList.remove('open');
    });
  });

  if (dialog) {
    var closeBtn = document.querySelector('.dialog-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  }

  function jumpToCategory(category) {
    var tab = category && tabsWrap
      ? tabsWrap.querySelector('.category-tab[data-category="' + category + '"]')
      : null;
    if (tab) tab.click();
    var catalog = document.querySelector('#catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-collection]'), function (tile) {
    tile.addEventListener('click', function (event) {
      event.preventDefault();
      jumpToCategory(tile.dataset.collection);
    });
  });

  var beshineLink = document.querySelector('[data-beshine-link]');
  if (beshineLink) {
    beshineLink.addEventListener('click', function (event) {
      event.preventDefault();
      jumpToCategory('Silver');
    });
  }

  /* ---------- business details ---------- */

  function setBusinessInfo() {
    var phone = String(cfg.businessPhone || '').trim();
    var address = String(cfg.businessAddress || '').trim();
    var hours = String(cfg.openingHours || '').trim();

    Array.prototype.forEach.call(document.querySelectorAll('[data-business-address], [data-footer-address]'), function (el) {
      if (address) el.textContent = address;
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-business-phone-link], [data-footer-phone]'), function (el) {
      if (!phone) { el.style.display = 'none'; return; }
      el.textContent = phone;
      el.href = 'tel:' + phone.replace(/[^\d+]/g, '');
    });

    if (hours) {
      var hoursEl = document.querySelector('.visit-details > div:last-child p');
      if (hoursEl) hoursEl.textContent = hours;
    }

    var contact = document.querySelector('[data-contact-whatsapp]');
    if (contact) {
      if (waDigits) {
        contact.href = 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent('Hello Super Jewellers, I would like to get in touch.');
        contact.textContent = 'WhatsApp enquiry ↗';
        contact.target = '_blank';
        contact.rel = 'noopener';
      } else if (cfg.whatsappChannelUrl) {
        contact.href = cfg.whatsappChannelUrl;
        contact.textContent = 'Join WhatsApp Channel ↗';
        contact.target = '_blank';
        contact.rel = 'noopener';
      } else {
        contact.style.display = 'none';
      }
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-social]'), function (link) {
      var key = link.dataset.social + 'Url';
      var url = String(cfg[key] || '').trim();
      if (/^https:\/\//i.test(url)) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
      } else {
        link.style.display = 'none';
      }
    });

    [['[data-map-link]', 'mapsUrl'], ['[data-review-link]', 'reviewUrl'], ['[data-whatsapp-channel]', 'whatsappChannelUrl']]
      .forEach(function (pair) {
        Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (link) {
          var url = String(cfg[pair[1]] || '').trim();
          if (/^https:\/\//i.test(url)) {
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
          } else {
            link.style.display = 'none';
          }
        });
      });
  }

  var yearEl = document.querySelector('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setBusinessInfo();
  renderTabs();
  renderProducts();
})();
