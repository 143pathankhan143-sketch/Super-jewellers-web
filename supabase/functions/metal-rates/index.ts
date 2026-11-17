import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const CITY = "India";
const SOURCE = "goldprice.dev spot benchmark";
const CACHE_MS = 6 * 60 * 60 * 1000;

type RateRow = {
  city: string;
  gold_24k_per_10g: number;
  gold_22k_per_10g: number;
  silver_per_kg: number;
  rate_date: string;
  fetched_at: string;
  provider_computed_at: string | null;
  is_stale: boolean;
  confidence: string | null;
  source: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function localDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function publicRates(row: RateRow, stale: boolean) {
  return {
    success: true,
    city: row.city,
    gold24kPer10g: Number(row.gold_24k_per_10g),
    gold22kPer10g: Number(row.gold_22k_per_10g),
    silverPerKg: Number(row.silver_per_kg),
    rateDate: row.rate_date,
    fetchedAt: row.fetched_at,
    providerComputedAt: row.provider_computed_at,
    confidence: row.confidence || "spot benchmark",
    source: row.source,
    stale: stale || row.is_stale,
    gstIncluded: false,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET") return json({ success: false, error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ success: false, error: "Rates storage is not configured." }, 503);

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: cached } = await db.from("metal_rates").select("*").eq("city", CITY).maybeSingle();
  if (cached?.fetched_at && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_MS) {
    return json(publicRates(cached as RateRow, localDate(cached.rate_date) !== localDate(new Date())));
  }

  try {
    // Free, keyless INR spot endpoints. Keep requests server-side and cache them in Supabase.
    const [goldResponse, silverResponse] = await Promise.all([
      fetch("https://api.goldprice.dev/v1/carat?currency=INR", { signal: AbortSignal.timeout(12000) }),
      fetch("https://api.goldprice.dev/v1/convert?from=XAG&to=INR&amount=1&unit=kg", { signal: AbortSignal.timeout(12000) }),
    ]);
    if (!goldResponse.ok || !silverResponse.ok) {
      throw new Error(`Price source response: gold ${goldResponse.status}, silver ${silverResponse.status}`);
    }
    const [gold, silver] = await Promise.all([goldResponse.json(), silverResponse.json()]);
    const gold24PerGram = Number(gold?.price_gram_24k);
    const gold22PerGram = Number(gold?.price_gram_22k);
    const silverPerKg = Number(silver?.result);
    const values = [gold24PerGram, gold22PerGram, silverPerKg];
    if (gold?.currency !== "INR" || silver?.to !== "INR" || !values.every((value) => Number.isFinite(value) && value > 0)) {
      throw new Error("Price source returned incomplete INR metal data.");
    }
    const providerTime = String(gold.timestamp || silver.timestamp || new Date().toISOString());
    const row = {
      city: CITY,
      gold_24k_per_10g: gold24PerGram * 10,
      gold_22k_per_10g: gold22PerGram * 10,
      silver_per_kg: silverPerKg,
      rate_date: localDate(providerTime),
      fetched_at: new Date().toISOString(),
      provider_computed_at: providerTime,
      is_stale: false,
      confidence: "INR spot benchmark; free feed is delayed",
      source: SOURCE,
    };
    const { data: saved, error } = await db.from("metal_rates").upsert(row, { onConflict: "city" }).select("*").single();
    if (error) throw error;
    return json(publicRates(saved as RateRow, localDate(providerTime) !== localDate(new Date())));
  } catch (error) {
    console.error("Metal rate refresh failed:", error);
    if (cached) return json(publicRates(cached as RateRow, true));
    return json({ success: false, error: "Today's rate is temporarily unavailable." }, 502);
  }
});
