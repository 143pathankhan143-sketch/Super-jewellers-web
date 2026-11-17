const config = window.SJ_CONFIG || {};
export const isConfigured = Boolean(window.supabase && config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes('YOUR-PROJECT') && !config.supabaseAnonKey.includes('YOUR_SUPABASE'));
export const supabase = isConfigured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;
export const fallbackImage = (category = 'Gold') => {
  const key = String(category).toLowerCase();
  if (key.includes('silver')) return 'assets/royal-silver.jpg';
  if (key.includes('diamond')) return 'assets/royal-diamond.jpg';
  if (key.includes('bridal')) return 'assets/royal-hero.jpg';
  return 'assets/royal-gold.jpg';
};
export function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Price on enquiry';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: number % 1 ? 2 : 0 }).format(number);
}
export function safeImage(url, category) {
  return url && /^https:\/\//i.test(url) ? url : fallbackImage(category);
}
