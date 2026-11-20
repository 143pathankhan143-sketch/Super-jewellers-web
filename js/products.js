/* ============================================================
   SUPER JEWELLERS · PRODUCT LIST
   ------------------------------------------------------------
   Website bilkul static hai — koi database, koi login nahi.
   Naya product add karne ke liye niche wale array mein entry daalo
   aur file save karke push kar do. Kuch aur nahi karna.

   Ek entry ka format:

   {
     name: 'Aaranya Gold Necklace',        // product ka naam
     category: 'Gold',                      // Gold | Diamond | Silver | Bridal
     description: 'Handcrafted 22K ...',    // 1-2 line description
     price: 0,                              // 0 = "Enquire for price"
     image: 'assets/products/necklace-1.jpg' // photo ka path
   }

   Photo add karna ho to `assets/products/` folder banao aur
   usme JPG/PNG rakho. Sirf apni dukan ki asli photos use karo.

   Array khaali hai to site apne aap saaf-suthra
   "visit us / call us" panel dikhayegi — koi dikhawa product nahi.
   ============================================================ */

window.SJ_PRODUCTS = [
  // Yahan apne asli products add karo — jaise:
  //
  // {
  //   name: 'Kundan Bridal Set',
  //   category: 'Bridal',
  //   description: 'Traditional kundan set with matching earrings, crafted for wedding wear.',
  //   price: 0,
  //   image: 'assets/products/kundan-bridal-set.jpg'
  // },
];
