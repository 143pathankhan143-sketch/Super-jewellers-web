/* ============================================================
   SUPER JEWELLERS · PRODUCT LIST
   ------------------------------------------------------------
   Website bilkul static hai — koi database, koi login nahi.
   Naya product add karne ke liye neeche wale array mein entry daalo
   aur file save karke push kar do.

   📷 PHOTO KAHAN RAKHNI HAI
   1. Photo ko `assets/products/` folder mein daalo
   2. Naam simple rakho, bina space (jaise: minilacha-916.jpg)
   3. JPG / PNG / WebP chalega, 300 KB se kam best hai
   4. Har photo wahi honi chahiye jo dukan mein actually available ho

   ------------------------------------------------------------
   EK ENTRY KA FORMAT
   ------------------------------------------------------------
   {
     name: 'Minilacha 916',                    // product ka naam
     category: 'Gold',                         // Gold | Diamond | Silver | Bridal
     description: '916 hallmarked gold minilacha ...',  // 1-2 line
     price: 0,                                 // 0 = "Enquire for price"
     image: 'assets/products/minilacha-916.jpg'
   }

   Array khaali hai to site apne aap saaf "visit us / call us"
   panel dikhati hai — koi dikhawa product nahi.
   ============================================================ */

window.SJ_PRODUCTS = [
  /* ------------------------------------------------------------
     NEECHE TUMHARI INSTAGRAM SE LIYE GAYE ASLI PRODUCT NAMES HAIN
     (@super_jewellers__ ke captions se).

     Photo mil jaye to `//` hata do aur image ka path sahi kar do.
     Photo ke bina entry add NA karo — warna galat image dikhegi.
     ------------------------------------------------------------ */

  // { name: 'Minilacha 916',      category: 'Gold',    description: '916 hallmarked gold minilacha with intricate traditional work.', price: 0, image: 'assets/products/minilacha-916.jpg' },
  // { name: 'Arabic Haar 916',    category: 'Gold',    description: 'Arabic-pattern 916 gold haar with a layered, regal silhouette.', price: 0, image: 'assets/products/arabic-haar-916.jpg' },
  // { name: 'Ranihar 916',        category: 'Bridal',  description: 'Classic Maharashtrian ranihar set in 916 gold for wedding wear.', price: 0, image: 'assets/products/ranihar-916.jpg' },
  // { name: 'Antique Gold Haar',  category: 'Gold',    description: 'Antique-finish gold haar with temple-inspired detailing.', price: 0, image: 'assets/products/antique-haar.jpg' },
  // { name: 'Gold Jhumka 916',    category: 'Gold',    description: '916 gold jhumkas with a traditional domed profile and fine filigree.', price: 0, image: 'assets/products/jhumka-916.jpg' },
  // { name: 'Gold Bangles 916',   category: 'Gold',    description: '916 gold bangles with a comfortable everyday fit.', price: 0, image: 'assets/products/bangles-916.jpg' },
  // { name: 'Diamond Ring',       category: 'Diamond', description: 'Certified diamond ring in a refined, minimal setting.', price: 0, image: 'assets/products/diamond-ring.jpg' },
  // { name: 'Ruby Necklace',      category: 'Bridal',  description: 'Gold necklace set with ruby accents for bridal and festive wear.', price: 0, image: 'assets/products/ruby-necklace.jpg' },
  // { name: 'Silver Pendant Set', category: 'Silver',  description: '925 silver pendant with matching chain from the ZEON range.', price: 0, image: 'assets/products/silver-pendant-set.jpg' },
];
