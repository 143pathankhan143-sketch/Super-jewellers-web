/* ============================================================
   SUPER JEWELLERS · STORE (shared data layer)
   ------------------------------------------------------------
   Static site ke liye lightweight data layer:
   - Products  → localStorage (owner Admin dashboard se manage hote hain)
   - Reservations / Appointments / Custom enquiries → is device par save
     + turant WhatsApp par owner ko bhej di jaati hain (live channel).
   - Business hours & appointment slots ke pure helpers yahan hain.

   Koi secret yahan NAHI hai. Ye file browser mein chalti hai.
   Node (tests) ke liye bhi safe: window/localStorage na ho to
   in-memory fallback ban jata hai.
   ============================================================ */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window : globalThis;
  var mem = {};
  var hasLS = typeof localStorage !== 'undefined';

  function lsGet(key, fallback) {
    try {
      var raw = hasLS ? localStorage.getItem(key) : (mem[key] || null);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    var raw = JSON.stringify(value);
    try {
      if (hasLS) localStorage.setItem(key, raw); else mem[key] = raw;
      return true;
    } catch (e) { return false; } // quota exceeded
  }

  var KEYS = {
    products: 'sj_products_v1',
    reservations: 'sj_reservations_v1',
    appointments: 'sj_appointments_v1',
    enquiries: 'sj_custom_enquiries_v1',
    settings: 'sj_settings_v1',
    adminAuth: 'sj_admin_auth_v1',
    adminSession: 'sj_admin_session_v1'
  };

  var AVAILABILITY = {
    available: 'Available',
    unavailable: 'Temporarily Unavailable',
    reserved: 'Reserved',
    hidden: 'Hidden'
  };

  var STATUS_LABELS = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    new: 'New',
    contacted: 'Contacted',
    closed: 'Closed'
  };

  function slugify(text) {
    return String(text || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
  }

  function randomDigits(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  function todayStamp() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return String(d.getFullYear()).slice(2) + m + day;
  }

  /* Unique IDs: SJ-R-261121-4821 (Reservation), SJ-A-… (Appointment), SJ-C-… (Custom) */
  function makeId(prefix) {
    return 'SJ-' + prefix + '-' + todayStamp() + '-' + randomDigits(4);
  }

  function normalizeProduct(p, index) {
    p = p || {};
    var name = String(p.name || '').trim();
    var id = String(p.id || '').trim() || slugify(p.code || name || 'item-' + index);
    return {
      id: id,
      code: String(p.code || '').trim() || '',
      name: name,
      category: String(p.category || 'Gold').trim(),
      type: String(p.type || '').trim(),
      purity: String(p.purity || '').trim(),
      description: String(p.description || '').trim(),
      weight: String(p.weight || '').trim(),
      price: Number(p.price) > 0 ? Number(p.price) : 0,
      material: String(p.material || '').trim(),
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : (p.image ? [p.image] : []),
      availability: AVAILABILITY[p.availability] ? p.availability : 'available',
      featured: !!p.featured,
      newArrival: !!p.newArrival,
      popular: !!p.popular,
      createdAt: p.createdAt || new Date().toISOString()
    };
  }

  function seedProducts() {
    var seed = Array.isArray(root.SJ_PRODUCTS) ? root.SJ_PRODUCTS : [];
    return seed.map(normalizeProduct);
  }

  function getProducts() {
    var stored = lsGet(KEYS.products, null);
    if (!Array.isArray(stored)) {
      stored = seedProducts();
      lsSet(KEYS.products, stored);
    }
    return stored.map(normalizeProduct);
  }

  function saveProducts(list) {
    return lsSet(KEYS.products, (list || []).map(normalizeProduct));
  }

  function resetProductsToSeed() {
    return saveProducts(seedProducts());
  }

  /* Public = catalogue-visible (hidden status excluded). */
  function getPublicProducts() {
    return getProducts().filter(function (p) {
      return p.name && p.availability !== 'hidden';
    });
  }

  function getProduct(id) {
    id = String(id || '');
    var all = getProducts();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id || all[i].code === id) return all[i];
    }
    return null;
  }

  /* ---------- reservations / appointments / enquiries ---------- */

  function getList(key) {
    var list = lsGet(key, []);
    return Array.isArray(list) ? list : [];
  }

  function getReservations() { return getList(KEYS.reservations); }
  function getAppointments() { return getList(KEYS.appointments); }
  function getEnquiries() { return getList(KEYS.enquiries); }

  function upsert(key, record) {
    var list = getList(key);
    var i = list.findIndex(function (r) { return r.id === record.id; });
    if (i > -1) list[i] = record; else list.unshift(record);
    return lsSet(key, list);
  }

  function updateRecord(key, id, patch) {
    var list = getList(key);
    var i = list.findIndex(function (r) { return r.id === id; });
    if (i === -1) return false;
    list[i] = Object.assign({}, list[i], patch, { updatedAt: new Date().toISOString() });
    return lsSet(key, list);
  }

  function addReservation(data) {
    var record = Object.assign({
      id: makeId('R'),
      createdAt: new Date().toISOString(),
      status: 'pending',
      notes: ''
    }, data);
    var ok = upsert(KEYS.reservations, record);
    return ok ? record : null;
  }

  function addAppointment(data) {
    var record = Object.assign({
      id: makeId('A'),
      createdAt: new Date().toISOString(),
      status: 'pending',
      notes: ''
    }, data);
    var ok = upsert(KEYS.appointments, record);
    return ok ? record : null;
  }

  function addEnquiry(data) {
    var record = Object.assign({
      id: makeId('C'),
      createdAt: new Date().toISOString(),
      status: 'new'
    }, data);
    var ok = upsert(KEYS.enquiries, record);
    return ok ? record : null;
  }

  /* ---------- business hours & appointment slots ---------- */

  function cfg() { return root.SJ_CONFIG || {}; }

  function hoursForDate(dateStr) {
    var c = cfg();
    var h = c.hours || {};
    var parts = String(dateStr || '').split('-');
    var date = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date();
    var isSunday = date.getDay() === 0;
    return {
      open: isSunday ? (h.sundayOpen || '11:00') : (h.weekdayOpen || '11:00'),
      close: isSunday ? (h.sundayClose || '18:00') : (h.weekdayClose || '20:30'),
      isSunday: isSunday
    };
  }

  function toMinutes(hhmm) {
    var p = String(hhmm || '').split(':');
    return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0);
  }

  function toHHMM(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function formatTime12(hhmm) {
    var p = String(hhmm || '').split(':');
    var h = Number(p[0]);
    var m = p[1] || '00';
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + suffix;
  }

  /* All slots for a date (30-min default), inside business hours. */
  function slotsForDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))) return [];
    var hrs = hoursForDate(dateStr);
    var step = Number(cfg().slotMinutes) > 0 ? Number(cfg().slotMinutes) : 30;
    var open = toMinutes(hrs.open);
    var close = toMinutes(hrs.close);
    var out = [];
    for (var t = open; t + step <= close; t += step) out.push(toHHMM(t));
    return out;
  }

  function isToday(dateStr) {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return dateStr === d.getFullYear() + '-' + m + '-' + day;
  }

  function dateToISODate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function minDate() { return dateToISODate(new Date()); }

  function maxDate() {
    var ahead = Number(cfg().maxVisitDaysAhead) > 0 ? Number(cfg().maxVisitDaysAhead) : 60;
    var d = new Date(); d.setDate(d.getDate() + ahead);
    return dateToISODate(d);
  }

  /* Booking statuses that occupy a slot. */
  var BLOCKING = { pending: true, confirmed: true };

  function bookedCount(dateStr, time) {
    return getAppointments().filter(function (a) {
      return a.date === dateStr && a.time === time && BLOCKING[a.status];
    }).length;
  }

  function slotCapacity() {
    return Number(cfg().slotCapacity) > 0 ? Number(cfg().slotCapacity) : 3;
  }

  /* Returns { slot: [...], full: [...], remaining: n } for one slot. */
  function slotStatus(dateStr, time) {
    var booked = bookedCount(dateStr, time);
    var cap = slotCapacity();
    return { booked: booked, capacity: cap, full: booked >= cap, remaining: Math.max(0, cap - booked) };
  }

  function validateVisitDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))) return 'Please choose a valid date.';
    if (dateStr < minDate()) return 'Please choose today or a later date.';
    if (dateStr > maxDate()) return 'Appointments can be booked up to ' + Number(cfg().maxVisitDaysAhead || 60) + ' days ahead.';
    if (!slotsForDate(dateStr).length) return 'The showroom is closed on this date.';
    return '';
  }

  function validateVisitTime(dateStr, time) {
    var slots = slotsForDate(dateStr);
    if (slots.indexOf(time) === -1) return 'Please choose a time slot inside business hours.';
    var st = slotStatus(dateStr, time);
    if (st.full) return 'That time slot is full. Please pick another time.';
    return '';
  }

  /* ---------- WhatsApp message builders ---------- */

  function waNumber() { return String(cfg().whatsappNumber || '').replace(/\D/g, ''); }

  function waLink(message) {
    var n = waNumber();
    if (!n) return String(cfg().whatsappChannelUrl || cfg().mapsUrl || '#');
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(message);
  }

  function telLink() {
    return 'tel:' + String(cfg().businessPhone || '').replace(/[^\d+]/g, '');
  }

  function generalMessage() {
    return 'Hello Super Jewellers, I would like to know more about your collections. Please share details.';
  }

  function productMessage(p) {
    var msg = 'Hello Super Jewellers, I would like to enquire about ' + (p && p.name ? p.name : 'a piece');
    if (p && p.code) msg += ' (Code: ' + p.code + ')';
    if (p && p.price > 0) msg += '. Price shown: ₹' + p.price;
    else msg += '.';
    msg += ' Please share details and availability.';
    return msg;
  }

  function reservationMessage(r) {
    var lines = [
      'Hello Super Jewellers, I would like to submit a STORE VISIT RESERVATION request.',
      '',
      'Reservation ID: ' + r.id,
      'Name: ' + r.name,
      'Mobile: ' + r.phone
    ];
    (r.products || []).forEach(function (p, i) {
      lines.push('Piece ' + (i + 1) + ': ' + p.name + (p.code ? ' (' + p.code + ')' : ''));
    });
    lines.push('Preferred visit: ' + r.date + ' at ' + formatTime12(r.time));
    if (r.visitors) lines.push('Visitors: ' + r.visitors);
    if (r.message) lines.push('Message: ' + r.message);
    lines.push('', 'I understand this is a request and is confirmed only by the store.');
    return lines.join('\n');
  }

  function appointmentMessage(a) {
    return [
      'Hello Super Jewellers, I would like to book a STORE VISIT APPOINTMENT.',
      '',
      'Appointment ID: ' + a.id,
      'Name: ' + a.name,
      'Mobile: ' + a.phone,
      'Date: ' + a.date + ' at ' + formatTime12(a.time),
      'Interested in: ' + (a.interest || 'General visit'),
      'Visitors: ' + (a.visitors || '1'),
      a.notes ? 'Notes: ' + a.notes : '',
      '',
      'I understand this is a request and is confirmed only by the store.'
    ].filter(Boolean).join('\n');
  }

  function enquiryMessage(e) {
    return [
      'Hello Super Jewellers, I would like a CUSTOM JEWELLERY quote.',
      '',
      'Enquiry ID: ' + e.id,
      'Name: ' + e.name,
      'Mobile: ' + e.phone,
      'Jewellery type: ' + e.type,
      'Preferred material: ' + e.material || '',
      'Budget: ' + (e.budget || 'Not specified'),
      'Design: ' + e.description,
      '',
      'I will share any reference photos on WhatsApp.'
    ].filter(Boolean).join('\n');
  }

  /* ---------- admin auth (browser-local best effort) ----------
     NOTE: Static hosting par real secure auth nahi ho sakta. Ye
     password SHA-256 hash ke roop me browser me hi rehta hai, plaintext
     kahin NAHI jata. Full security ke liye README me backend upgrade
     path diya gaya hai. ---------------------------------------- */

  async function hashPassword(password) {
    var text = 'sj-admin::' + String(password || '');
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    /* Fallback (very old browsers / node without webcrypto): djb2 */
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return 'fb-' + h.toString(16);
  }

  function getAdminAuth() { return lsGet(KEYS.adminAuth, null); } // { hash, createdAt }

  async function setAdminPassword(password) {
    var hash = await hashPassword(password);
    return lsSet(KEYS.adminAuth, { hash: hash, createdAt: new Date().toISOString() });
  }

  async function verifyAdminPassword(password) {
    var auth = getAdminAuth();
    if (!auth || !auth.hash) return false;
    var hash = await hashPassword(password);
    return hash === auth.hash;
  }

  function isAdminSession() {
    try { return sessionStorage.getItem(KEYS.adminSession) === '1'; } catch (e) { return false; }
  }
  function setAdminSession(on) {
    try {
      if (on) sessionStorage.setItem(KEYS.adminSession, '1');
      else sessionStorage.removeItem(KEYS.adminSession);
    } catch (e) { /* ignore */ }
  }

  /* ---------- settings (owner overrides from Admin → Settings) ---------- */

  function getSettings() { return lsGet(KEYS.settings, {}) || {}; }

  function saveSettings(patch) {
    var next = Object.assign(getSettings(), patch || {});
    return lsSet(KEYS.settings, next);
  }

  /* Effective config = seed config + owner overrides (phone, hours, etc). */
  function effectiveConfig() {
    var base = Object.assign({}, cfg());
    var s = getSettings();
    ['businessPhone', 'whatsappNumber', 'businessAddress', 'hoursDisplay', 'instagramUrl', 'announcement'].forEach(function (k) {
      if (s[k] != null && String(s[k]).trim() !== '') base[k] = s[k];
    });
    if (s.hours && typeof s.hours === 'object') base.hours = Object.assign({}, base.hours, s.hours);
    if (s.slotCapacity != null) base.slotCapacity = s.slotCapacity;
    if (s.slotMinutes != null) base.slotMinutes = s.slotMinutes;
    return base;
  }

  var api = {
    KEYS: KEYS,
    AVAILABILITY: AVAILABILITY,
    STATUS_LABELS: STATUS_LABELS,
    slugify: slugify,
    makeId: makeId,
    normalizeProduct: normalizeProduct,
    getProducts: getProducts,
    saveProducts: saveProducts,
    resetProductsToSeed: resetProductsToSeed,
    getPublicProducts: getPublicProducts,
    getProduct: getProduct,
    getReservations: getReservations,
    getAppointments: getAppointments,
    getEnquiries: getEnquiries,
    addReservation: addReservation,
    addAppointment: addAppointment,
    addEnquiry: addEnquiry,
    updateRecord: updateRecord,
    upsert: upsert,
    KEYS_LIST: [KEYS.reservations, KEYS.appointments, KEYS.enquiries],
    hoursForDate: hoursForDate,
    toMinutes: toMinutes,
    toHHMM: toHHMM,
    formatTime12: formatTime12,
    slotsForDate: slotsForDate,
    minDate: minDate,
    maxDate: maxDate,
    isToday: isToday,
    bookedCount: bookedCount,
    slotCapacity: slotCapacity,
    slotStatus: slotStatus,
    validateVisitDate: validateVisitDate,
    validateVisitTime: validateVisitTime,
    waNumber: waNumber,
    waLink: waLink,
    telLink: telLink,
    generalMessage: generalMessage,
    productMessage: productMessage,
    reservationMessage: reservationMessage,
    appointmentMessage: appointmentMessage,
    enquiryMessage: enquiryMessage,
    getAdminAuth: getAdminAuth,
    setAdminPassword: setAdminPassword,
    verifyAdminPassword: verifyAdminPassword,
    isAdminSession: isAdminSession,
    setAdminSession: setAdminSession,
    getSettings: getSettings,
    saveSettings: saveSettings,
    effectiveConfig: effectiveConfig
  };

  root.SJ = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
