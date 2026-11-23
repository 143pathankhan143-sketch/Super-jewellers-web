/* ============================================================
   SUPER JEWELLERS · PRODUCT LIST (seed data)
   ------------------------------------------------------------
   Website bilkul static hai — koi database, koi login nahi.
   Is file mein sirf SITE ke default products hain.

   👉 Naya product add karne ka aasaan tarika:
      Admin dashboard (admin.html) kholo → Products → "+ Add piece".
      Wahan se add kiya gaya product isi browser mein live ho jayega
      aur "Export" button se JSON mil jayega ise repo mein paste
      karne ke liye (README dekho).

   ------------------------------------------------------------
   EK ENTRY KA FORMAT
   ------------------------------------------------------------
   {
     id: 'minilacha-916',            // unique slug
     code: 'SJ-1001',                // product code (SKU)
     name: 'Minilacha 916',
     category: 'Gold',               // Gold | Silver | Diamond | Bridal | Special
     type: 'Necklace',               // Necklace | Bangles | Earrings | Rings | Chains | Pendants | Bracelets | Sets | Other
     purity: '22K (916) BIS Hallmarked',
     description: '916 hallmarked gold minilacha ...',
     weight: '',                     // optional — KABHI guess mat karo
     price: 0,                       // 0 = "Enquire for price" (owner decides)
     material: 'Gold',
     images: ['assets/products/minilacha-916.jpg'],
     availability: 'available',      // available | unavailable | reserved | hidden
     featured: true,
     newArrival: false,
     popular: false,
     createdAt: '2026-11-21T00:00:00.000Z'
   }

   ⚠️  KABHI bhi fabricated price, weight, certificate ya specification
       mat likho. Sirf dukan ki verified detail dalo.
   Array khaali hai to site apne aap saaf "visit us / call us"
   panel dikhati hai — koi dikhawa product nahi.
   ============================================================ */

window.SJ_PRODUCTS = [
  /* Photo mil jaye to `//` hata do aur image ka path sahi kar do.
     Photo ke bina entry add NA karo — warna galat image dikhegi. */

  // { id: 'minilacha-916', code: 'SJ-1001', name: 'Minilacha 916', category: 'Gold', type: 'Necklace', purity: '22K (916) BIS Hallmarked', description: '916 hallmarked gold minilacha with intricate traditional work.', weight: '', price: 0, material: 'Gold', images: ['assets/products/minilacha-916.jpg'], availability: 'available', featured: true, newArrival: false, popular: false, createdAt: '2026-11-21T00:00:00.000Z' },
  // { id: 'arabic-haar-916', code: 'SJ-1002', name: 'Arabic Haar 916', category: 'Gold', type: 'Necklace', purity: '22K (916) BIS Hallmarked', description: 'Arabic-pattern 916 gold haar with a layered, regal silhouette.', weight: '', price: 0, material: 'Gold', images: ['assets/products/arabic-haar-916.jpg'], availability: 'available', featured: false, newArrival: true, popular: false, createdAt: '2026-11-21T00:00:00.000Z' },
  // { id: 'ranihar-916', code: 'SJ-1003', name: 'Ranihar 916', category: 'Bridal', type: 'Necklace', purity: '22K (916) BIS Hallmarked', description: 'Classic Maharashtrian ranihar set in 916 gold for wedding wear.', weight: '', price: 0, material: 'Gold', images: ['assets/products/ranihar-916.jpg'], availability: 'available', featured: false, newArrival: false, popular: true, createdAt: '2026-11-21T00:00:00.000Z' }
];

/* Catalogue categories & types — admin dropdown aur filters isi se bante hain. */
window.SJ_CATEGORIES = ['Gold', 'Silver', 'Diamond', 'Bridal', 'Special'];

window.SJ_TYPES = ['Necklace', 'Bangles', 'Earrings', 'Rings', 'Chains', 'Pendants', 'Bracelets', 'Sets', 'Other'];
