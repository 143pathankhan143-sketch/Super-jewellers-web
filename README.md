# Super Jewellers · Latur

Static storefront website for **Super Jewellers, Latur** — gold, diamond, silver and 925 silver jewellery.

Live: <https://143pathankhan143-sketch.github.io/Super-jewellers-web/>

No backend, no database, no login, no API keys. The whole site is plain HTML, CSS and JavaScript, hosted free on GitHub Pages.

---

## Project structure

```
index.html            Storefront (single page, sections: hero, rates, collections, catalogue, visit)
privacy.html          Privacy policy
terms.html            Terms & support
css/style.css         All site styling
js/config.js          Business details — phone, address, hours, social links
js/products.js        Product list (edit this to add jewellery)
js/main.js            Storefront behaviour — catalogue, filters, product dialog
assets/               Brand and collection imagery
robots.txt            Crawler rules
sitemap.xml           Sitemap (pages)
sitemap-pages.xml     Sitemap (fresh path used for Google Search Console)
```

## Adding a product

1. Put the photo in `assets/products/` (JPG, PNG or WebP, under ~300 KB is ideal).
2. Open `js/products.js` and add an entry:

```js
window.SJ_PRODUCTS = [
  {
    name: 'Kundan Bridal Set',
    category: 'Bridal',            // Gold | Diamond | Silver | Bridal
    description: 'Traditional kundan set with matching earrings.',
    price: 0,                      // 0 shows "Enquire for price"
    image: 'assets/products/kundan-bridal-set.jpg'
  }
];
```

3. Commit and push. The catalogue grid, category tabs and product dialog update automatically.

While `SJ_PRODUCTS` is empty, the catalogue section shows a clean "visit us / call us" panel — no placeholder or invented products are displayed anywhere.

## Editing business details

Everything customer-facing lives in `js/config.js`: phone number, address, opening hours, Instagram profiles, Google Maps link, WhatsApp channel and the Google review URL.

- Leave `whatsappNumber` blank until a verified enquiry number exists. Buttons then point to the WhatsApp Channel instead.
- Leave `reviewUrl` blank and the "Rate My Shop" button simply does not render.

## Metal rates

Rates are **not** pulled automatically. The section states that gold and silver rates change daily and invites customers to call or message for the confirmed rate. Update the wording in `index.html` (`<section class="rates-section">`) if a rate feed is added later.

## Local preview

ES modules are no longer used, but a local server is still the safest preview:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Push to `main`. The workflow in `.github/workflows/pages.yml` publishes the repository to GitHub Pages (Pages → Source must be set to **GitHub Actions**).

## SEO setup already in place

- Unique `<title>` and meta description on all three pages
- Self-referencing canonical URLs
- Open Graph and Twitter card tags
- `JewelryStore` structured data (address, phone, opening hours, social profiles)
- `robots.txt` plus two sitemaps
- Descriptive `alt` text, lazy-loaded images, inline SVG favicon
- Google Search Console verification meta tag in `index.html`

## A note on imagery

The four images in `assets/` are campaign artwork, not photographs of stock. Replace them with the shop's own photographs before presenting the catalogue as current inventory.
