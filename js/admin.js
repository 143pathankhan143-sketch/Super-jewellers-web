/* ============================================================
   SUPER JEWELLERS · OWNER ADMIN DASHBOARD (admin.html)
   ------------------------------------------------------------
   Products · Reservations · Appointments · Custom enquiries · Settings
   Sab kuch browser-local (localStorage). Login password bhi yahin
   browser me SHA-256 hash ke roop me rehta hai — plaintext kahin nahi.
   Full server-side security ke liye README me backend upgrade path hai.
   ============================================================ */
(function () {
  'use strict';

  var store = window.SJ || {};
  var ui = window.SJ_UI || {};
  var $ = ui.$ || function (s) { return document.querySelector(s); };
  var $$ = ui.$$ || function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var escapeHtml = ui.escapeHtml || String;
  var formatPrice = ui.formatPrice || String;
  var toast = ui.toast || function () {};
  var fallbackImage = ui.fallbackImage || function () { return 'assets/royal-gold.jpg'; };

  if (!document.body.classList.contains('admin-page')) return;

  var loginPanel = $('#login-panel');
  var setupPanel = $('#setup-panel');
  var dashboard = $('#dashboard');
  var loginError = $('#login-error');

  var CATEGORIES = window.SJ_CATEGORIES || ['Gold', 'Silver', 'Diamond', 'Bridal', 'Special'];
  var TYPES = window.SJ_TYPES || ['Necklace', 'Bangles', 'Earrings', 'Rings', 'Chains', 'Pendants', 'Bracelets', 'Sets', 'Other'];
  var AVAIL = store.AVAILABILITY || { available: 'Available', unavailable: 'Temporarily Unavailable', reserved: 'Reserved', hidden: 'Hidden' };
  var STATUS = store.STATUS_LABELS || {};

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  /* ---------- auth gate ---------- */

  async function boot() {
    if (!store.getAdminAuth || !store.getAdminAuth()) {
      hide(loginPanel);
      show(setupPanel);
      return;
    }
    if (store.isAdminSession && store.isAdminSession()) {
      enterDashboard();
      return;
    }
    show(loginPanel);
  }

  var setupForm = $('#setup-form');
  if (setupForm) {
    setupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var p1 = $('#setup-password', setupForm);
      var p2 = $('#setup-confirm', setupForm);
      var err = $('#setup-error', setupForm);
      err.textContent = '';
      if ((p1.value || '').length < 6) { err.textContent = 'Password should be at least 6 characters.'; return; }
      if (p1.value !== p2.value) { err.textContent = 'Both passwords must match.'; return; }
      await store.setAdminPassword(p1.value);
      store.setAdminSession(true);
      toast('Admin password set for this browser.');
      enterDashboard();
    });
  }

  var loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      loginError.textContent = '';
      var btn = loginForm.querySelector('[type="submit"]');
      btn.disabled = true;
      var ok = await store.verifyAdminPassword($('#admin-password', loginForm).value);
      btn.disabled = false;
      if (!ok) { loginError.textContent = 'Incorrect password.'; return; }
      store.setAdminSession(true);
      enterDashboard();
    });
  }

  var logoutBtn = $('#logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      store.setAdminSession(false);
      location.reload();
    });
  }

  /* ---------- dashboard ---------- */

  function enterDashboard() {
    hide(loginPanel); hide(setupPanel);
    show(dashboard);
    renderAll();
    switchTab('overview');
  }

  function switchTab(name) {
    $$('.admin-tab').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.admin-panel').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    if (name === 'products') renderProducts();
    if (name === 'reservations') renderReservations();
    if (name === 'appointments') renderAppointments();
    if (name === 'enquiries') renderEnquiries();
    if (name === 'settings') renderSettings();
  }

  $$('.admin-tab').forEach(function (b) {
    b.addEventListener('click', function () { switchTab(b.dataset.tab); });
  });

  function renderAll() { renderOverview(); }

  function renderOverview() {
    var products = store.getProducts();
    var reservations = store.getReservations();
    var appointments = store.getAppointments();
    var today = store.minDate ? store.minDate() : '';
    var stats = [
      ['Total products', products.length],
      ['Available', products.filter(function (p) { return p.availability === 'available'; }).length],
      ['Reserved', products.filter(function (p) { return p.availability === 'reserved'; }).length],
      ['Pending reservations', reservations.filter(function (r) { return r.status === 'pending'; }).length],
      ['Confirmed reservations', reservations.filter(function (r) { return r.status === 'confirmed'; }).length],
      ["Today's appointments", appointments.filter(function (a) { return a.date === today && ['pending', 'confirmed'].indexOf(a.status) > -1; }).length],
      ['Upcoming appointments', appointments.filter(function (a) { return a.date >= today && ['pending', 'confirmed'].indexOf(a.status) > -1; }).length],
      ['Custom enquiries', store.getEnquiries().filter(function (e) { return e.status === 'new'; }).length]
    ];
    var wrap = $('#overview-stats');
    if (wrap) {
      wrap.innerHTML = stats.map(function (s) {
        return '<div class="stat-card"><span>' + escapeHtml(s[0]) + '</span><b>' + s[1] + '</b></div>';
      }).join('');
    }
    var note = $('#overview-note');
    if (note) {
      note.innerHTML =
        '<b>How this dashboard works.</b> Products you add here are saved in this browser and shown on the site opened from this browser. ' +
        'Customer reservations, appointments and custom enquiries arrive <b>on your WhatsApp</b> (+91 97644 53486) the moment they are submitted — ' +
        'records that appear in the tabs below are entries made from this device (for example, taken over the counter). ' +
        'To make products permanent for every visitor, use <b>Export</b> in Products and paste the JSON into <code>js/products.js</code> (see README).';
    }
  }

  /* ---------- products ---------- */

  var editingId = null;
  var uploadBuffers = []; // dataURLs for the open editor

  function renderProducts() {
    var list = store.getProducts();
    var tbody = $('#admin-products');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5">No products yet. Add your first piece.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (p) {
      var img = (p.images && p.images[0]) || fallbackImage(p.category);
      return '<tr>' +
        '<td><div class="table-product"><img src="' + escapeHtml(img) + '" alt="" onerror="this.onerror=null;this.src=\'' + fallbackImage(p.category) + '\'">' +
        '<span><b>' + escapeHtml(p.name) + '</b><small>' + escapeHtml(p.code || p.id) + ' · ' + escapeHtml(p.category) + '</small></span></div></td>' +
        '<td>' + escapeHtml(p.category) + (p.type ? '<br><small>' + escapeHtml(p.type) + '</small>' : '') + '</td>' +
        '<td>' + (p.price > 0 ? escapeHtml(formatPrice(p.price)) : 'Enquiry') + '</td>' +
        '<td><span class="status-pill' + (p.availability === 'available' ? '' : ' off') + '">' + escapeHtml(AVAIL[p.availability] || p.availability) + '</span>' +
        (p.featured ? '<br><small>★ Featured' + (p.newArrival ? ' · New' : '') + (p.popular ? ' · Popular' : '') + '</small>' : '') +
        (p.newArrival && !p.featured ? '<br><small>New arrival</small>' : '') + '</td>' +
        '<td><div class="table-actions">' +
        '<button type="button" data-action="edit" data-id="' + escapeHtml(p.id) + '">Edit</button>' +
        '<button type="button" data-action="toggle" data-id="' + escapeHtml(p.id) + '">' + (p.availability === 'hidden' ? 'Publish' : 'Hide') + '</button>' +
        '<button type="button" data-action="delete" data-id="' + escapeHtml(p.id) + '">Delete</button>' +
        '</div></td></tr>';
    }).join('');

    tbody.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () { handleProductAction(b.dataset.action, b.dataset.id); });
    });
  }

  function handleProductAction(action, id) {
    var list = store.getProducts();
    var p = list.find(function (x) { return x.id === id; });
    if (!p) return;
    if (action === 'edit') { openEditor(p); return; }
    if (action === 'toggle') {
      p.availability = p.availability === 'hidden' ? 'available' : 'hidden';
      store.saveProducts(list);
      renderProducts(); renderOverview();
      toast(p.availability === 'hidden' ? 'Product hidden from the site.' : 'Product published.');
      return;
    }
    if (action === 'delete') {
      if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
      store.saveProducts(list.filter(function (x) { return x.id !== id; }));
      renderProducts(); renderOverview();
      toast('Product deleted.');
    }
  }

  var editor = $('#product-editor');
  var productForm = $('#product-form');

  function fillSelect(select, options, current) {
    select.innerHTML = options.map(function (o) {
      return '<option value="' + escapeHtml(o) + '"' + (o === current ? ' selected' : '') + '>' + escapeHtml(o) + '</option>';
    }).join('');
  }

  function openEditor(p) {
    editingId = p ? p.id : null;
    uploadBuffers = p ? (p.images || []).slice() : [];
    renderImagePreviews();
    if (productForm) {
      productForm.reset();
      $('#editor-title').textContent = p ? 'Edit this piece' : 'Add a piece';
      fillSelect($('#p-category', productForm), CATEGORIES, p ? p.category : CATEGORIES[0]);
      fillSelect($('#p-type', productForm), [''].concat(TYPES), p ? p.type : '');
      /* availability: value = key, label = human text */
      var availSel = $('#p-availability', productForm);
      availSel.innerHTML = Object.keys(AVAIL).map(function (k) {
        var current = p ? p.availability : 'available';
        return '<option value="' + escapeHtml(k) + '"' + (k === current ? ' selected' : '') + '>' + escapeHtml(AVAIL[k]) + '</option>';
      }).join('');
      $('#p-name', productForm).value = p ? p.name : '';
      $('#p-code', productForm).value = p ? p.code : '';
      $('#p-purity', productForm).value = p ? p.purity : '';
      $('#p-material', productForm).value = p ? p.material : '';
      $('#p-weight', productForm).value = p ? p.weight : '';
      $('#p-price', productForm).value = p && p.price > 0 ? p.price : '';
      $('#p-description', productForm).value = p ? p.description : '';
      $('#p-featured', productForm).checked = p ? !!p.featured : false;
      $('#p-new', productForm).checked = p ? !!p.newArrival : false;
      $('#p-popular', productForm).checked = p ? !!p.popular : false;
    }
    $('#editor-error').textContent = '';
    if (editor && editor.showModal) editor.showModal();
  }

  function renderImagePreviews() {
    var wrap = $('#image-previews');
    if (!wrap) return;
    wrap.innerHTML = uploadBuffers.map(function (src, i) {
      return '<div class="img-preview"><img src="' + src + '" alt="">' +
        '<button type="button" data-img-remove="' + i + '" aria-label="Remove image">×</button></div>';
    }).join('');
  }

  if ($('#image-previews')) {
    $('#image-previews').addEventListener('click', function (e) {
      var b = e.target.closest('[data-img-remove]');
      if (!b) return;
      uploadBuffers.splice(Number(b.dataset.imgRemove), 1);
      renderImagePreviews();
    });
  }

  function downscale(file, max, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          try { resolve(canvas.toDataURL('image/jpeg', quality)); }
          catch (err) { resolve(reader.result); }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  var imageInput = $('#p-images');
  if (imageInput) {
    imageInput.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(imageInput.files || []);
      if (!files.length) return;
      var err = $('#editor-error');
      err.textContent = '';
      for (var i = 0; i < files.length && uploadBuffers.length < 6; i++) {
        var f = files[i];
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { err.textContent = 'Choose JPG, PNG or WebP images.'; continue; }
        if (f.size > 5 * 1024 * 1024) { err.textContent = 'Each image must be 5 MB or smaller.'; continue; }
        try { uploadBuffers.push(await downscale(f, 1000, 0.82)); }
        catch (e) { err.textContent = 'Could not read one of the images.'; }
      }
      imageInput.value = '';
      renderImagePreviews();
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#editor-error');
      err.textContent = '';
      var name = $('#p-name', productForm).value.trim();
      if (!name) { err.textContent = 'Product name is required.'; return; }

      var list = store.getProducts();
      var code = $('#p-code', productForm).value.trim();
      if (!code) code = 'SJ-' + String(1000 + list.length + 1);
      var idBase = store.slugify ? store.slugify(code || name) : name.toLowerCase();
      var id = editingId || idBase;
      if (!editingId && list.some(function (x) { return x.id === id; })) id = id + '-' + Date.now().toString(36);

      var record = store.normalizeProduct({
        id: id,
        code: code,
        name: name,
        category: $('#p-category', productForm).value,
        type: $('#p-type', productForm).value,
        purity: $('#p-purity', productForm).value.trim(),
        material: $('#p-material', productForm).value.trim(),
        weight: $('#p-weight', productForm).value.trim(),
        price: Number($('#p-price', productForm).value) || 0,
        description: $('#p-description', productForm).value.trim(),
        images: uploadBuffers.slice(),
        availability: $('#p-availability', productForm).value,
        featured: $('#p-featured', productForm).checked,
        newArrival: $('#p-new', productForm).checked,
        popular: $('#p-popular', productForm).checked,
        createdAt: editingId ? (list.find(function (x) { return x.id === editingId; }) || {}).createdAt : new Date().toISOString()
      });

      if (editingId) {
        list = list.map(function (x) { return x.id === editingId ? record : x; });
      } else {
        list.unshift(record);
      }

      if (!store.saveProducts(list)) {
        err.textContent = 'Storage is full — try fewer or smaller images, or remove some products.';
        return;
      }
      if (editor && editor.close) editor.close();
      renderProducts(); renderOverview();
      toast(editingId ? 'Product updated.' : 'Product added.');
      editingId = null;
    });
  }

  if (editor) {
    var closeBtn = $('#editor-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { editor.close(); });
    editor.addEventListener('click', function (e) { if (e.target === editor) editor.close(); });
  }

  var addBtn = $('#add-product-button');
  if (addBtn) addBtn.addEventListener('click', function () { openEditor(null); });

  /* Export / import / reset */
  var exportBtn = $('#export-products');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var json = JSON.stringify(store.getProducts(), null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sj-products.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Products exported. Paste into js/products.js to make them permanent (see README).');
    });
  }

  var importBtn = $('#import-products');
  if (importBtn) {
    importBtn.addEventListener('click', function () {
      var text = prompt('Paste the product JSON to import:');
      if (!text) return;
      try {
        var data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('not array');
        if (!store.saveProducts(data)) throw new Error('storage');
        renderProducts(); renderOverview();
        toast('Products imported.');
      } catch (e) { alert('That does not look like valid product JSON.'); }
    });
  }

  var resetBtn = $('#reset-products');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!confirm('Reset products to the site defaults (js/products.js)? Local changes will be lost.')) return;
      store.resetProductsToSeed();
      renderProducts(); renderOverview();
      toast('Products reset to site defaults.');
    });
  }

  /* ---------- reservations / appointments / enquiries ---------- */

  function statusPill(status) {
    var cls = status === 'confirmed' ? ' on' : (status === 'pending' ? '' : ' off');
    return '<span class="status-pill' + cls + '">' + escapeHtml(STATUS[status] || status) + '</span>';
  }

  function renderReservations() {
    var tbody = $('#admin-reservations');
    if (!tbody) return;
    var list = store.getReservations();
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6">No reservations yet on this device. Customer requests arrive on WhatsApp.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (r) {
      var pieces = (r.products || []).map(function (p) { return p.name; }).join(', ');
      return '<tr>' +
        '<td><b>' + escapeHtml(r.id) + '</b><br><small>' + escapeHtml((r.createdAt || '').slice(0, 10)) + '</small></td>' +
        '<td>' + escapeHtml(r.name) + '<br><small>' + escapeHtml(r.phone) + '</small></td>' +
        '<td>' + escapeHtml(pieces || '—') + '</td>' +
        '<td>' + escapeHtml(r.date) + '<br><small>' + escapeHtml(store.formatTime12 ? store.formatTime12(r.time) : r.time) + '</small></td>' +
        '<td>' + statusPill(r.status) + (r.notes ? '<br><small>' + escapeHtml(r.notes) + '</small>' : '') + '</td>' +
        '<td><div class="table-actions">' +
        '<button type="button" data-r-action="confirmed" data-id="' + escapeHtml(r.id) + '">Confirm</button>' +
        '<button type="button" data-r-action="rejected" data-id="' + escapeHtml(r.id) + '">Reject</button>' +
        '<button type="button" data-r-action="completed" data-id="' + escapeHtml(r.id) + '">Completed</button>' +
        '<a class="mini-link" href="https://wa.me/' + escapeHtml(r.phone ? '91' + r.phone : '') + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</div></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-r-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        var notes = '';
        if (b.dataset.rAction === 'rejected' || b.dataset.rAction === 'confirmed') {
          notes = prompt('Internal note (optional):') || '';
        }
        store.updateRecord(store.KEYS.reservations, b.dataset.id, { status: b.dataset.rAction, notes: notes });
        renderReservations(); renderOverview();
        toast('Reservation updated.');
      });
    });
  }

  function renderAppointments() {
    var tbody = $('#admin-appointments');
    if (!tbody) return;
    var list = store.getAppointments();
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6">No appointments on this device yet.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td><b>' + escapeHtml(a.id) + '</b></td>' +
        '<td>' + escapeHtml(a.name) + '<br><small>' + escapeHtml(a.phone) + '</small></td>' +
        '<td>' + escapeHtml(a.date) + '<br><small>' + escapeHtml(store.formatTime12 ? store.formatTime12(a.time) : a.time) + '</small></td>' +
        '<td>' + escapeHtml(a.interest || 'General') + '<br><small>' + escapeHtml(a.visitors || '1') + ' visitor(s)</small></td>' +
        '<td>' + statusPill(a.status) + '</td>' +
        '<td><div class="table-actions">' +
        '<button type="button" data-a-action="confirmed" data-id="' + escapeHtml(a.id) + '">Confirm</button>' +
        '<button type="button" data-a-action="reschedule" data-id="' + escapeHtml(a.id) + '">Reschedule</button>' +
        '<button type="button" data-a-action="cancelled" data-id="' + escapeHtml(a.id) + '">Cancel</button>' +
        '<button type="button" data-a-action="completed" data-id="' + escapeHtml(a.id) + '">Done</button>' +
        '</div></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-a-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        var action = b.dataset.aAction;
        var patch = { status: action };
        if (action === 'reschedule') {
          var rec = store.getAppointments().find(function (x) { return x.id === b.dataset.id; });
          var date = prompt('New date (YYYY-MM-DD):', rec ? rec.date : '');
          if (!date) return;
          var time = prompt('New time (HH:MM, within business hours):', rec ? rec.time : '');
          if (!time) return;
          var dErr = store.validateVisitDate(date);
          var tErr = store.validateVisitTime(date, time);
          if (dErr || tErr) { alert(dErr || tErr); return; }
          patch = { date: date, time: time, status: 'confirmed' };
        }
        if (action === 'cancelled' && !confirm('Cancel this appointment?')) return;
        store.updateRecord(store.KEYS.appointments, b.dataset.id, patch);
        renderAppointments(); renderOverview();
        toast('Appointment updated.');
      });
    });
  }

  function renderEnquiries() {
    var wrap = $('#admin-enquiries');
    if (!wrap) return;
    var list = store.getEnquiries();
    if (!list.length) {
      wrap.innerHTML = '<p class="muted">No custom enquiries on this device yet.</p>';
      return;
    }
    wrap.innerHTML = list.map(function (e) {
      return '<article class="enquiry-card">' +
        '<header><b>' + escapeHtml(e.name) + '</b> · ' + escapeHtml(e.phone) +
        ' <span class="status-pill' + (e.status === 'new' ? '' : ' off') + '">' + escapeHtml(STATUS[e.status] || e.status) + '</span></header>' +
        '<p><small>' + escapeHtml(e.id) + ' · ' + escapeHtml((e.createdAt || '').slice(0, 10)) + '</small></p>' +
        '<p><b>' + escapeHtml(e.type) + '</b> · ' + escapeHtml(e.material) + (e.budget ? ' · ' + escapeHtml(e.budget) : '') + '</p>' +
        '<p>' + escapeHtml(e.description) + '</p>' +
        (e.image ? '<img class="enquiry-img" src="' + e.image + '" alt="Reference">' : '') +
        '<div class="table-actions">' +
        '<button type="button" data-e-action="contacted" data-id="' + escapeHtml(e.id) + '">Mark contacted</button>' +
        '<button type="button" data-e-action="closed" data-id="' + escapeHtml(e.id) + '">Close</button>' +
        '<a class="mini-link" href="https://wa.me/91' + escapeHtml(e.phone) + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</div></article>';
    }).join('');
    wrap.querySelectorAll('[data-e-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        store.updateRecord(store.KEYS.enquiries, b.dataset.id, { status: b.dataset.eAction });
        renderEnquiries(); renderOverview();
      });
    });
  }

  /* ---------- settings ---------- */

  function renderSettings() {
    var s = store.getSettings();
    var base = window.SJ_CONFIG || {};
    var f = $('#settings-form');
    if (!f) return;
    $('#s-phone', f).value = s.businessPhone || base.businessPhone || '';
    $('#s-whatsapp', f).value = s.whatsappNumber || base.whatsappNumber || '';
    $('#s-address', f).value = s.businessAddress || base.businessAddress || '';
    $('#s-hours', f).value = s.hoursDisplay || base.hoursDisplay || '';
    $('#s-instagram', f).value = s.instagramUrl || base.instagramUrl || '';
    $('#s-announcement', f).value = s.announcement || '';
    $('#s-capacity', f).value = (s.slotCapacity != null ? s.slotCapacity : (base.slotCapacity || 3));
  }

  var settingsForm = $('#settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      store.saveSettings({
        businessPhone: $('#s-phone', settingsForm).value.trim(),
        whatsappNumber: $('#s-whatsapp', settingsForm).value.replace(/\D/g, ''),
        businessAddress: $('#s-address', settingsForm).value.trim(),
        hoursDisplay: $('#s-hours', settingsForm).value.trim(),
        instagramUrl: $('#s-instagram', settingsForm).value.trim(),
        announcement: $('#s-announcement', settingsForm).value.trim(),
        slotCapacity: Math.max(1, Number($('#s-capacity', settingsForm).value) || 3)
      });
      toast('Settings saved for this browser.');
      renderOverview();
    });
  }

  boot();
})();
