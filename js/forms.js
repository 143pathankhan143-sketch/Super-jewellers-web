/* ============================================================
   SUPER JEWELLERS · BOOKING & ENQUIRY FORMS
   reserve.html · appointment.html · custom.html
   ------------------------------------------------------------
   - Business hours + slot capacity strictly enforced
   - Unique reference ID generated on submit
   - Record saved on this device + sent to the owner on WhatsApp
   - NEVER claims a reservation is "confirmed" — always "pending"
   ============================================================ */
(function () {
  'use strict';

  var store = window.SJ || {};
  var ui = window.SJ_UI || {};
  var $ = ui.$ || function (s) { return document.querySelector(s); };
  var $$ = ui.$$ || function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var escapeHtml = ui.escapeHtml || String;
  var toast = ui.toast || function () {};

  var page = document.body.dataset.page;

  function cfg() { return store.effectiveConfig ? store.effectiveConfig() : (window.SJ_CONFIG || {}); }

  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  function validMobile(v) {
    var d = digits(v);
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    return /^[6-9]\d{9}$/.test(d);
  }

  function fmtMobile(v) {
    var d = digits(v);
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    return d;
  }

  function showFieldError(input, message) {
    var field = input.closest('.form-field');
    if (!field) return;
    var err = field.querySelector('.field-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'field-error';
      field.appendChild(err);
    }
    err.textContent = message || '';
    field.classList.toggle('has-error', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function clearErrors(form) {
    $$('.field-error', form).forEach(function (e) { e.textContent = ''; });
    $$('.form-field', form).forEach(function (f) { f.classList.remove('has-error'); });
    var banner = form.querySelector('.form-banner');
    if (banner) { banner.hidden = true; banner.textContent = ''; }
  }

  function formBanner(form, message, kind) {
    var banner = form.querySelector('.form-banner');
    if (!banner) return;
    banner.hidden = false;
    banner.textContent = message;
    banner.className = 'form-banner ' + (kind || 'error');
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* Loading spinner state on a submit button */
  function setLoading(btn, on) {
    if (!btn) return;
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    btn.dataset.label = btn.dataset.label || btn.innerHTML;
    btn.innerHTML = on
      ? '<span class="btn-spinner" aria-hidden="true"></span> Please wait…'
      : btn.dataset.label;
  }

  /* Elegant success panel with golden checkmark */
  function showSuccess(panel, data) {
    var form = $('#booking-form') || $('#enquiry-form');
    if (form) form.hidden = true;
    var steps = $('.form-progress');
    if (steps) steps.hidden = true;
    if (!panel) return;
    panel.hidden = false;
    panel.innerHTML =
      '<div class="success-mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="72" height="72">' +
      '<circle class="ring" cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path class="tick" d="M19 33.5 27.5 42 46 23" fill="none" stroke="currentColor" stroke-width="3.5" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p class="eyebrow">' + escapeHtml(data.eyebrow || 'REQUEST RECEIVED') + '</p>' +
      '<h2>' + escapeHtml(data.title) + '</h2>' +
      '<p class="success-lead">' + escapeHtml(data.lead) + '</p>' +
      '<div class="reference-box"><span>' + escapeHtml(data.idLabel || 'YOUR REFERENCE NUMBER') + '</span>' +
      '<strong>' + escapeHtml(data.id) + '</strong></div>' +
      '<p class="success-note">' + escapeHtml(data.note) + '</p>' +
      '<div class="hero-actions">' + data.actions + '</div>';
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panel.focus();
  }

  /* =========================================================
     RESERVATION (reserve.html)
     ========================================================= */
  if (page === 'reserve') {
    var form = $('#booking-form');
    var productPicker = $('#reservation-products');
    var selectedWrap = $('#selected-products');
    var hiddenInput = $('#reservation-product-data');
    var successPanel = $('#success-panel');
    var selected = [];

    /* Preselect from ?product= */
    (function preselect() {
      var id = new URLSearchParams(location.search).get('product');
      if (!id) return;
      var p = store.getProduct ? store.getProduct(id) : null;
      if (p) addProduct(p);
    })();

    function renderPicker(query) {
      if (!productPicker) return;
      var all = (store.getPublicProducts ? store.getPublicProducts() : [])
        .filter(function (p) { return p.availability !== 'unavailable'; });
      var q = String(query || '').toLowerCase();
      var list = all.filter(function (p) {
        if (selected.some(function (s) { return s.id === p.id; })) return false;
        if (!q) return true;
        return (p.name + ' ' + p.code + ' ' + p.category).toLowerCase().indexOf(q) > -1;
      }).slice(0, 8);

      if (!all.length) {
        productPicker.innerHTML = '<p class="picker-empty">The online catalogue is being photographed. ' +
          'You can still send a reservation for a piece you saw on Instagram — ' +
          'type its name below, or <a href="custom.html">ask for a custom piece</a>.</p>';
        return;
      }
      if (!list.length) {
        productPicker.innerHTML = '<p class="picker-empty">No matching piece. Try another name or code.</p>';
        return;
      }
      productPicker.innerHTML = list.map(function (p) {
        return '<button type="button" class="picker-item" data-id="' + escapeHtml(p.id) + '">' +
          '<span class="picker-name">' + escapeHtml(p.name) + '</span>' +
          '<span class="picker-meta">' + escapeHtml([p.code, p.category].filter(Boolean).join(' · ')) + '</span>' +
          '</button>';
      }).join('');
    }

    function addProduct(p) {
      if (!p || selected.some(function (s) { return s.id === p.id; })) return;
      selected.push({ id: p.id, code: p.code || '', name: p.name });
      renderSelected();
      renderPicker($('#product-search') && $('#product-search').value);
      syncHidden();
      if (productPicker) productPicker.hidden = true;
    }

    function removeProduct(id) {
      selected = selected.filter(function (s) { return s.id !== id; });
      renderSelected();
      syncHidden();
      if (productPicker) productPicker.hidden = false;
    }

    function renderSelected() {
      if (!selectedWrap) return;
      if (!selected.length) {
        selectedWrap.innerHTML = '<p class="picker-hint">No piece selected yet — search above to pick one (you may pick several).</p>';
        return;
      }
      selectedWrap.innerHTML = selected.map(function (s) {
        return '<span class="selected-chip">' + escapeHtml(s.name) +
          (s.code ? ' <small>' + escapeHtml(s.code) + '</small>' : '') +
          '<button type="button" data-remove="' + escapeHtml(s.id) + '" aria-label="Remove ' + escapeHtml(s.name) + '">×</button></span>';
      }).join('');
    }

    function syncHidden() {
      if (hiddenInput) hiddenInput.value = JSON.stringify(selected);
    }

    var searchEl = $('#product-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        if (productPicker) productPicker.hidden = false;
        renderPicker(searchEl.value);
      });
      searchEl.addEventListener('focus', function () {
        if (productPicker) productPicker.hidden = false;
        renderPicker(searchEl.value);
      });
    }
    if (productPicker) {
      productPicker.addEventListener('click', function (e) {
        var btn = e.target.closest('.picker-item');
        if (!btn) return;
        var p = store.getProduct ? store.getProduct(btn.dataset.id) : null;
        addProduct(p);
        if (searchEl) { searchEl.value = ''; }
      });
    }
    if (selectedWrap) {
      selectedWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-remove]');
        if (btn) removeProduct(btn.dataset.remove);
      });
    }
    renderSelected();
    renderPicker('');

    /* Date + time slots (shared with appointment page) */
    setupVisitSlots(form, { requireProduct: false });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors(form);

        var name = $('#f-name', form);
        var phone = $('#f-phone', form);
        var date = $('#f-date', form);
        var time = $('#f-time', form);
        var consent = $('#f-consent', form);
        var manualName = $('#f-manual-product', form);
        var ok = true;

        if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(name, 'Please enter your full name.'); ok = false; }
        if (!validMobile(phone.value)) { showFieldError(phone, 'Please enter a valid 10-digit mobile number.'); ok = false; }

        var dateErr = store.validateVisitDate ? store.validateVisitDate(date.value) : '';
        if (dateErr) { showFieldError(date, dateErr); ok = false; }
        var timeErr = dateErr ? 'Choose a date first.' : (store.validateVisitTime ? store.validateVisitTime(date.value, time.value) : '');
        if (!time.value) timeErr = 'Please choose a preferred time slot.';
        if (timeErr) { showFieldError(time, timeErr); ok = false; }

        var products = [];
        try { products = JSON.parse(hiddenInput && hiddenInput.value ? hiddenInput.value : '[]'); } catch (err) { products = []; }
        if (!products.length && manualName && !manualName.value.trim()) {
          showFieldError(manualName, 'Select a piece from the list, or type the jewellery name you wish to view.');
          ok = false;
        }
        if (!consent.checked) { showFieldError(consent, 'Please agree so the store can contact you.'); ok = false; }

        if (!ok) {
          formBanner(form, 'Please correct the highlighted fields.');
          return;
        }

        var btn = form.querySelector('[type="submit"]');
        setLoading(btn, true);

        if (!products.length && manualName) {
          products = [{ id: 'manual', code: '', name: manualName.value.trim() }];
        }

        var record = store.addReservation({
          name: name.value.trim(),
          phone: fmtMobile(phone.value),
          products: products,
          date: date.value,
          time: time.value,
          visitors: ($('#f-visitors', form) || {}).value || '',
          message: ($('#f-message', form) || {}).value || '',
          consent: true
        });

        setTimeout(function () {
          setLoading(btn, false);
          if (!record) {
            formBanner(form, 'Could not save on this device — please send your request on WhatsApp instead.', 'error');
            return;
          }
          var waHref = store.reservationMessage ? store.waLink(store.reservationMessage(record)) : '#';
          showSuccess(successPanel, {
            eyebrow: 'RESERVATION REQUEST · PENDING APPROVAL',
            title: 'Your viewing request is in.',
            lead: 'Thank you, ' + record.name + '. The store will review availability and get back on WhatsApp to confirm your visit.',
            idLabel: 'RESERVATION ID',
            id: record.id,
            note: 'Important: this is a request, not a confirmation. Your piece is held only after the store approves it.',
            actions:
              '<a class="button button-gold" href="' + escapeHtml(waHref) + '" target="_blank" rel="noopener">Send on WhatsApp now <span>↗</span></a>' +
              '<a class="button button-ghost" href="catalog.html">Back to catalogue <span>↗</span></a>'
          });
          toast('Reservation ' + record.id + ' submitted.');
        }, 450);
      });
    }
  }

  /* =========================================================
     APPOINTMENT (appointment.html)
     ========================================================= */
  if (page === 'appointment') {
    var aForm = $('#booking-form');
    var aSuccess = $('#success-panel');
    setupVisitSlots(aForm, { requireProduct: false });

    if (aForm) {
      aForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors(aForm);

        var name = $('#f-name', aForm);
        var phone = $('#f-phone', aForm);
        var date = $('#f-date', aForm);
        var time = $('#f-time', aForm);
        var consent = $('#f-consent', aForm);
        var ok = true;

        if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(name, 'Please enter your full name.'); ok = false; }
        if (!validMobile(phone.value)) { showFieldError(phone, 'Please enter a valid 10-digit mobile number.'); ok = false; }

        var dateErr = store.validateVisitDate ? store.validateVisitDate(date.value) : '';
        if (dateErr) { showFieldError(date, dateErr); ok = false; }
        var timeErr = dateErr ? 'Choose a date first.' : (store.validateVisitTime ? store.validateVisitTime(date.value, time.value) : '');
        if (!time.value) timeErr = 'Please choose a time slot.';
        if (timeErr) { showFieldError(time, timeErr); ok = false; }
        if (!consent.checked) { showFieldError(consent, 'Please agree so the store can contact you.'); ok = false; }

        if (!ok) { formBanner(aForm, 'Please correct the highlighted fields.'); return; }

        var btn = aForm.querySelector('[type="submit"]');
        setLoading(btn, true);

        var record = store.addAppointment({
          name: name.value.trim(),
          phone: fmtMobile(phone.value),
          date: date.value,
          time: time.value,
          interest: ($('#f-interest', aForm) || {}).value || 'General visit',
          visitors: ($('#f-visitors', aForm) || {}).value || '1',
          notes: ($('#f-message', aForm) || {}).value || '',
          consent: true
        });

        setTimeout(function () {
          setLoading(btn, false);
          if (!record) {
            formBanner(aForm, 'Could not save on this device — please book on WhatsApp instead.');
            return;
          }
          var waHref = store.appointmentMessage ? store.waLink(store.appointmentMessage(record)) : '#';
          showSuccess(aSuccess, {
            eyebrow: 'APPOINTMENT REQUEST · PENDING APPROVAL',
            title: 'Your store visit is requested.',
            lead: 'Thank you, ' + record.name + '. We will confirm your slot with you on WhatsApp shortly.',
            idLabel: 'APPOINTMENT ID',
            id: record.id,
            note: 'The slot is held only after the store confirms. Business hours: ' + (cfg().hoursDisplay || '') + '.',
            actions:
              '<a class="button button-gold" href="' + escapeHtml(waHref) + '" target="_blank" rel="noopener">Send on WhatsApp now <span>↗</span></a>' +
              '<a class="button button-ghost" href="index.html">Back to home <span>↗</span></a>'
          });
          toast('Appointment ' + record.id + ' requested.');
        }, 450);
      });
    }
  }

  /* =========================================================
     CUSTOM JEWELLERY (custom.html)
     ========================================================= */
  if (page === 'custom') {
    var cForm = $('#enquiry-form');
    var cSuccess = $('#success-panel');
    var imagePreview = $('#image-preview');
    var imageInput = $('#f-image');
    var imageData = null;

    if (imageInput) {
      imageInput.addEventListener('change', function () {
        var file = imageInput.files && imageInput.files[0];
        if (!file) { imageData = null; if (imagePreview) imagePreview.innerHTML = ''; return; }
        if (file.size > 5 * 1024 * 1024) {
          showFieldError(imageInput, 'Image must be 5 MB or smaller.');
          imageData = null; imageInput.value = '';
          return;
        }
        showFieldError(imageInput, '');
        var reader = new FileReader();
        reader.onload = function () {
          /* Downscale to keep localStorage healthy */
          var img = new Image();
          img.onload = function () {
            var max = 900;
            var scale = Math.min(1, max / Math.max(img.width, img.height));
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            try { imageData = canvas.toDataURL('image/jpeg', 0.8); }
            catch (err) { imageData = reader.result; }
            if (imagePreview) {
              imagePreview.innerHTML = '<img src="' + imageData + '" alt="Reference preview">' +
                '<button type="button" id="remove-image" aria-label="Remove image">×</button>';
            }
          };
          img.onerror = function () { imageData = reader.result; };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'remove-image') {
        imageData = null;
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.innerHTML = '';
      }
    });

    if (cForm) {
      cForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors(cForm);

        var name = $('#f-name', cForm);
        var phone = $('#f-phone', cForm);
        var type = $('#f-type', cForm);
        var material = $('#f-material', cForm);
        var desc = $('#f-description', cForm);
        var consent = $('#f-consent', cForm);
        var ok = true;

        if (!name.value.trim() || name.value.trim().length < 2) { showFieldError(name, 'Please enter your full name.'); ok = false; }
        if (!validMobile(phone.value)) { showFieldError(phone, 'Please enter a valid 10-digit mobile number.'); ok = false; }
        if (!type.value) { showFieldError(type, 'Please choose a jewellery type.'); ok = false; }
        if (!material.value) { showFieldError(material, 'Please choose a preferred material.'); ok = false; }
        if (!desc.value.trim() || desc.value.trim().length < 10) { showFieldError(desc, 'Tell us a little more about your design (at least 10 characters).'); ok = false; }
        if (!consent.checked) { showFieldError(consent, 'Please agree so the store can contact you.'); ok = false; }

        if (!ok) { formBanner(cForm, 'Please correct the highlighted fields.'); return; }

        var btn = cForm.querySelector('[type="submit"]');
        setLoading(btn, true);

        var record = store.addEnquiry({
          name: name.value.trim(),
          phone: fmtMobile(phone.value),
          type: type.value,
          material: material.value,
          budget: ($('#f-budget', cForm) || {}).value || '',
          description: desc.value.trim(),
          image: imageData,
          consent: true
        });

        setTimeout(function () {
          setLoading(btn, false);
          if (!record) {
            formBanner(cForm, 'Could not save on this device — please send your idea on WhatsApp instead.');
            return;
          }
          var waHref = store.enquiryMessage ? store.waLink(store.enquiryMessage(record)) : '#';
          showSuccess(cSuccess, {
            eyebrow: 'CUSTOM JEWELLERY ENQUIRY · RECEIVED',
            title: 'Your idea is with us.',
            lead: 'Thank you, ' + record.name + '. Our team will review your design brief and reply on WhatsApp.',
            idLabel: 'ENQUIRY ID',
            id: record.id,
            note: imageData
              ? 'Your reference photo is saved with this request on this device — please also send it in the WhatsApp chat.'
              : 'Share reference photos any time in the WhatsApp chat.',
            actions:
              '<a class="button button-gold" href="' + escapeHtml(waHref) + '" target="_blank" rel="noopener">Continue on WhatsApp <span>↗</span></a>' +
              '<a class="button button-ghost" href="catalog.html">Browse catalogue <span>↗</span></a>'
          });
          toast('Enquiry ' + record.id + ' received.');
        }, 450);
      });
    }
  }

  /* =========================================================
     Shared: date → time-slot wiring (reserve + appointment)
     ========================================================= */
  function setupVisitSlots(form, opts) {
    if (!form) return;
    var dateInput = $('#f-date', form);
    var timeSelect = $('#f-time', form);
    if (!dateInput || !timeSelect) return;

    if (store.minDate) dateInput.min = store.minDate();
    if (store.maxDate) dateInput.max = store.maxDate();

    function fillTimes() {
      var date = dateInput.value;
      var previous = timeSelect.value;
      timeSelect.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      if (!date) {
        placeholder.textContent = 'Choose a date first';
        placeholder.disabled = true;
        placeholder.selected = true;
        timeSelect.appendChild(placeholder);
        return;
      }
      var err = store.validateVisitDate ? store.validateVisitDate(date) : '';
      if (err) {
        placeholder.textContent = err;
        placeholder.disabled = true;
        placeholder.selected = true;
        timeSelect.appendChild(placeholder);
        return;
      }
      var slots = store.slotsForDate ? store.slotsForDate(date) : [];
      var cap = store.slotCapacity ? store.slotCapacity() : 3;
      placeholder.textContent = 'Select a time';
      placeholder.disabled = true;
      placeholder.selected = true;
      timeSelect.appendChild(placeholder);
      slots.forEach(function (t) {
        var st = store.slotStatus ? store.slotStatus(date, t) : { full: false, remaining: cap };
        var opt = document.createElement('option');
        opt.value = t;
        var label = store.formatTime12 ? store.formatTime12(t) : t;
        if (st.full) {
          opt.textContent = label + ' — full';
          opt.disabled = true;
        } else {
          opt.textContent = label + (st.remaining < cap ? ' · ' + st.remaining + ' left' : '');
        }
        timeSelect.appendChild(opt);
      });
      if (previous && Array.prototype.some.call(timeSelect.options, function (o) { return o.value === previous && !o.disabled; })) {
        timeSelect.value = previous;
      }
    }

    dateInput.addEventListener('change', fillTimes);
    fillTimes();
  }
})();
