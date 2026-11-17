import { supabase, isConfigured, fallbackImage, formatPrice, safeImage } from './supabase.js';
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#product-dialog');
const toast = document.querySelector('#toast');
const cfg = window.SJ_CONFIG || {};
let allProducts = [];
let activeCategory = 'All';
let toastTimer;
const demos = [
  { id:'sample-gold', name:'Aaranya Gold Necklace', category:'Gold', description:'A graceful 22k-inspired necklace with delicate traditional detailing. An heirloom feeling, made for a celebration or an ordinary day made special.', price:0, image_url:'', is_active:true },
  { id:'sample-silver', name:'Chandni Silver Earrings', category:'Silver', description:'Sculptural silver jhumkas with a softly luminous finish. Easy to wear, lovely to keep.', price:0, image_url:'', is_active:true },
  { id:'sample-diamond', name:'Noor Diamond Pendant', category:'Diamond', description:'A refined pendant with a bright, beautifully simple silhouette. A thoughtful keepsake for someone special.', price:0, image_url:'', is_active:true },
  { id:'sample-bridal', name:'Gulabi Bridal Set', category:'Bridal', description:'A statement bridal set inspired by the colour and poetry of Indian wedding traditions.', price:0, image_url:'', is_active:true }
];
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3000)}
function whatsappUrl(product){const number=String(cfg.whatsappNumber||'').replace(/\D/g,'');const msg=`Hello Super Jewellers, I would like to enquire about ${product.name}${product.price?` (${formatPrice(product.price)})`:''}.`;return number?`https://wa.me/${number}?text=${encodeURIComponent(msg)}`:(cfg.whatsappChannelUrl||`https://wa.me/?text=${encodeURIComponent(msg)}`)}
function whatsappActionLabel(){return String(cfg.whatsappNumber||'').replace(/\D/g,'')?'Enquire on WhatsApp':'Join WhatsApp Channel'}
function renderProducts(){
 const products=activeCategory==='All'?allProducts:allProducts.filter(p=>p.category===activeCategory);
 if(!products.length){grid.innerHTML='<div class="empty-state">A new favourite is on its way.<br><small>Check back soon, or explore another collection.</small></div>';return;}
 grid.innerHTML=products.map(p=>`<article class="product-card" tabindex="0" data-id="${escapeHtml(p.id)}" aria-label="View ${escapeHtml(p.name)} details"><div class="product-photo"><img loading="lazy" src="${escapeHtml(safeImage(p.image_url,p.category))}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='${fallbackImage(p.category)}'"><span class="product-badge">${escapeHtml(p.category)}</span><button class="product-open" aria-label="View ${escapeHtml(p.name)} details">↗</button></div><div class="product-info"><span class="category-label">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><span class="product-price">${Number(p.price)>0?formatPrice(p.price):'Enquire for price'}</span><a class="product-enquire" href="${escapeHtml(whatsappUrl(p))}">${whatsappActionLabel()} <span>↗</span></a></div></article>`).join('');
 grid.querySelectorAll('.product-card').forEach(card=>{card.addEventListener('click',e=>{if(e.target.closest('.product-enquire'))return;openProduct(allProducts.find(p=>p.id===card.dataset.id))});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProduct(allProducts.find(p=>p.id===card.dataset.id))}})});
}
function openProduct(p){if(!p)return;const price=Number(p.price)>0?formatPrice(p.price):'Price on enquiry';document.querySelector('#dialog-content').innerHTML=`<div class="dialog-product"><img src="${escapeHtml(safeImage(p.image_url,p.category))}" alt="${escapeHtml(p.name)}"><div class="dialog-product-copy"><p class="eyebrow">${escapeHtml(p.category.toUpperCase())} · SUPER JEWELLERS</p><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.description)}</p><div class="dialog-price">${price}</div><a class="button button-dark" href="${escapeHtml(whatsappUrl(p))}">${whatsappActionLabel()} <span>↗</span></a></div></div>`;dialog.showModal()}
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function loadProducts(){
 if(isConfigured){const {data,error}=await supabase.from('products').select('id,name,category,description,price,image_url,is_active,created_at').eq('is_active',true).order('created_at',{ascending:false});if(!error){allProducts=data||[];renderProducts();return;}console.error('Could not load public products:',error.message);grid.innerHTML='<div class="empty-state">We’re having trouble loading the collection.<br><small>Please try again in a little while.</small></div>';return;}
 allProducts=demos;renderProducts();document.querySelector('#catalog-note').textContent='Preview collection shown. Connect Supabase and add your products to publish the live catalogue.';
}
function renderCategoryTabs(names){const unique=[...new Set(names)].filter(Boolean);const tabs=document.querySelector('.category-tabs');tabs.innerHTML=[['All','All pieces'],...unique.map(name=>[name,name])].map(([key,label],i)=>`<button class="category-tab ${i===0?'active':''}" data-category="${escapeHtml(key)}" role="tab" aria-selected="${i===0?'true':'false'}">${escapeHtml(label)}</button>`).join('');activeCategory='All'}
document.querySelector('.category-tabs').addEventListener('click',e=>{const button=e.target.closest('.category-tab');if(!button)return;document.querySelectorAll('.category-tab').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',b===button?'true':'false')});activeCategory=button.dataset.category;renderProducts()});
async function loadCategories(){if(!isConfigured)return;const {data,error}=await supabase.from('categories').select('name').order('name');if(!error&&data){renderCategoryTabs(data.map(row=>row.name));renderProducts()}}
document.querySelector('.menu-toggle').addEventListener('click',e=>{const nav=document.querySelector('.main-nav');const open=nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.setAttribute('aria-label',open?'Close navigation':'Open navigation')});document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.main-nav').classList.remove('open')));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
document.querySelectorAll('[data-collection]').forEach(tile=>tile.addEventListener('click',e=>{e.preventDefault();const category=tile.dataset.collection;const tab=[...document.querySelectorAll('.category-tab')].find(b=>b.dataset.category===category);if(tab)tab.click();document.querySelector('#catalog').scrollIntoView({behavior:'smooth'})}));
document.querySelector('[data-beshine-link]').addEventListener('click',e=>{e.preventDefault();const tab=[...document.querySelectorAll('.category-tab')].find(b=>b.dataset.category==='Silver');if(tab)tab.click();document.querySelector('#catalog').scrollIntoView({behavior:'smooth'})});
function setBusinessInfo(){
 const phone=String(cfg.businessPhone||'').trim();const address=String(cfg.businessAddress||'').trim();const hours=String(cfg.openingHours||'').trim();
 document.querySelector('[data-business-address]').textContent=address||'[Add your store address]';document.querySelector('[data-footer-address]').textContent=address||'[Add your store address]';
 const phoneEl=document.querySelector('[data-business-phone-link]');const footerPhone=document.querySelector('[data-footer-phone]');
 if(phone){phoneEl.textContent=phone;phoneEl.href=`tel:${phone.replace(/[^+\d]/g,'')}`;footerPhone.textContent=phone;footerPhone.href=`tel:${phone.replace(/[^+\d]/g,'')}`}else{phoneEl.textContent='[Add your phone number]';phoneEl.href='#';footerPhone.textContent='[Add your phone number]';footerPhone.href='#'}
 if(hours)document.querySelector('.visit-details > div:last-child p').textContent=hours;
 const contact=document.querySelector('[data-contact-whatsapp]');const num=String(cfg.whatsappNumber||'').replace(/\D/g,'');
 if(num){contact.href=`https://wa.me/${num}?text=${encodeURIComponent('Hello Super Jewellers, I would like to get in touch.')}`;contact.textContent='WhatsApp enquiry ↗';contact.removeAttribute('target');contact.rel='noopener'}else if(cfg.whatsappChannelUrl){contact.href=cfg.whatsappChannelUrl;contact.textContent='Join WhatsApp Channel ↗';contact.removeAttribute('target');contact.rel='noopener'}else{contact.href='#visit';contact.textContent='Add WhatsApp details';contact.addEventListener('click',e=>{e.preventDefault();showToast('Add your WhatsApp channel or verified chat number in js/config.js.')})}
 document.querySelectorAll('[data-social]').forEach(link=>{const network=link.dataset.social;const url=String(cfg[`${network}Url`]||'').trim();if(url&&/^https:\/\//i.test(url)){link.href=url;link.target='_blank';link.rel='noopener';link.textContent=network==='instagramOfficial'?'Instagram · Official ↗':'Super Jewellers on Instagram ↗'}else{link.textContent=network==='instagramOfficial'?'[Add official Instagram profile]':'[Add Instagram profile]';link.href='#visit';link.addEventListener('click',e=>{e.preventDefault();showToast(`Add the verified ${network==='instagramOfficial'?'official Instagram':'Instagram'} profile URL in js/config.js.`)})}})
 for(const [selector,key,label] of [['[data-map-link]','mapsUrl','MAP'],['[data-review-link]','reviewUrl','RATE MY SHOP'],['[data-whatsapp-channel]','whatsappChannelUrl','WHATSAPP CHANNEL']]){document.querySelectorAll(selector).forEach(link=>{const url=String(cfg[key]||'').trim();if(url&&/^https:\/\//i.test(url)){link.href=url;if(key==='whatsappChannelUrl')link.removeAttribute('target');else link.target='_blank';link.rel='noopener'}else link.addEventListener('click',e=>{e.preventDefault();showToast(`Add the verified ${label} URL in js/config.js.`)})})}
}
async function loadMetalRates(){
 const status=document.querySelector('#rate-status');const updated=document.querySelector('#rate-updated');
 if(!isConfigured){status.textContent='RATE FEED SETUP PENDING';updated.textContent='Connect Supabase and configure the secure daily rate feed to publish prices.';return}
 try{
  const {data,error}=await supabase.functions.invoke('metal-rates',{method:'GET'});
  if(error||!data?.success)throw new Error(data?.error||error?.message||'Rate feed unavailable');
  const inr=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
  document.querySelector('#rate-gold-24').textContent=inr.format(Number(data.gold24kPer10g));
  document.querySelector('#rate-gold-22').textContent=inr.format(Number(data.gold22kPer10g));
  document.querySelector('#rate-silver').textContent=inr.format(Number(data.silverPerKg));
  const date=new Date(`${data.rateDate}T00:00:00+05:30`);
  const dateLabel=Number.isNaN(date.getTime())?data.rateDate:new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(date);
  const computed=data.providerComputedAt?new Date(data.providerComputedAt):null;
  const timeLabel=computed&&!Number.isNaN(computed.getTime())?new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'}).format(computed)+' IST':'';
  status.textContent=data.stale?'LAST AVAILABLE SPOT RATE':'INDICATIVE INDIA SPOT RATE';
  updated.textContent=`Source data: ${dateLabel}${timeLabel?` · ${timeLabel}`:''}${data.stale?' · Showing the last available rate while the feed refreshes.':''}`;
 }catch(error){console.warn('Daily rates unavailable:',error);status.textContent='TODAY’S RATE IS UNAVAILABLE';updated.textContent='Please contact Super Jewellers to confirm today’s rate.'}
}
document.querySelector('#year').textContent=new Date().getFullYear();setBusinessInfo();Promise.all([loadProducts(),loadCategories(),loadMetalRates()]);
