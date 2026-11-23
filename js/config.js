/* ============================================================
   SUPER JEWELLERS · SITE CONFIG
   ------------------------------------------------------------
   Yahan sirf business ki verified details hain.
   Koi password, API key ya secret kabhi is file mein mat daalna —
   ye file har visitor ke browser mein download hoti hai.
   ============================================================ */

window.SJ_CONFIG = {
  businessName: 'Super Jewellers',
  legalName: 'Super Empire Industries Pvt. Ltd.',

  businessPhone: '+91 97644 53486', // tel: link isi se banta hai
  businessAddress: 'Super Empire Industries Pvt. Ltd., Shop 04, Subhash Chowk Rd, Bhande Galli, Bhusar Line (Near Gojamgunde Complex), Sawe Wadi, Latur, Maharashtra 413512',
  businessAddressShort: 'Shop 04 · Bhande Galli · Subhash Chowk · Latur 413512',

  /* WhatsApp — international digits only, bina + ya space (919876543210). */
  whatsappNumber: '919764453486',

  /* Business hours — used by appointment slots & reservation date rules.
     24-hour "HH:MM" strings. weekday = Monday to Saturday. */
  hours: {
    weekdayOpen: '11:00',
    weekdayClose: '20:30',
    sundayOpen: '11:00',
    sundayClose: '18:00'
  },
  hoursDisplay: 'Monday – Saturday: 11:00 AM – 8:30 PM · Sunday: 11:00 AM – 6:00 PM',

  /* Store visit appointment settings (owner can override in Admin → Settings). */
  slotMinutes: 30,
  slotCapacity: 3,
  maxVisitDaysAhead: 60,

  instagramUrl: 'https://www.instagram.com/super_jewellers__',
  instagramOfficialUrl: 'https://www.instagram.com/super_jewellers_official_/',
  mapsUrl: 'https://maps.app.goo.gl/6y6HvuZfmR6vARVn9',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VaA7m0a84Om6mZvrBe44',

  // Google Business Profile ka verified review link.
  // Blank ho to "Rate My Shop" button site par nahi dikhta.
  reviewUrl: '',

  /* Google rating as provided by the business (4.9 / 650+ reviews).
     Kept here so the owner can correct it in one place. */
  googleRating: 4.9,
  googleReviewCount: '650+',

  /* Homepage announcement bar — blank = hidden. Admin → Settings se badal sakte hain. */
  announcement: '',

  /* Customer testimonials — REAL quotes only. Empty array = section
     automatically falls back to the Google reviews call-to-action.
     Koi fake review yahan mat daalna. */
  testimonials: []
};
