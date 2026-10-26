// fund-quotes: Supabase Edge Function for Dividend Buy Planner.
// Browsers can't read market-data sites directly, so this fetches, on the server, each
// ticker's latest price, 52-week range and the last year of distributions (with ex-dates)
// from Yahoo Finance's public chart endpoint. Signed-in users only (keep "Verify JWT" on),
// so the function can't be used as an open proxy.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(await isSignedIn(req))) return json({ error: "signed_out" }, 401);

  let symbols: string[] = [];
  try {
    const body = await req.json();
    symbols = (Array.isArray(body.symbols) ? body.symbols : [])
      .map((s: unknown) => String(s).toUpperCase().trim())
      .filter((s: string) => /^[A-Z0-9.\-^=]{1,12}$/.test(s));
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  symbols = [...new Set(symbols)].slice(0, 40);
  if (!symbols.length) return json({ error: "no_symbols" }, 400);

  const quotes: Record<string, unknown> = {};
  await Promise.all(symbols.map(async (s) => {
    try {
      quotes[s] = await quote(s);
    } catch (e) {
      quotes[s] = { error: String((e as Error).message || e) };
    }
  }));
  return json({ quotes, fetchedAt: new Date().toISOString() });
});

async function quote(sym: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d&events=div`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(url, {
      signal: ctl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "accept": "application/json",
      },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "unreachable");
  const data = await res.json();
  const r = data?.chart?.result?.[0];
  if (!r) throw new Error("not_found");
  const m = r.meta || {};
  const closes: number[] = (r.indicators?.quote?.[0]?.close || []).filter((v: unknown) => typeof v === "number");
  const price = num(m.regularMarketPrice) ?? closes[closes.length - 1];
  if (!(price > 0)) throw new Error("no_price");
  const high = num(m.fiftyTwoWeekHigh) ?? Math.max(...closes, price);
  const low = num(m.fiftyTwoWeekLow) ?? Math.min(...closes, price);
  const divEvents = Object.values(r.events?.dividends || {}) as { amount: number; date: number }[];
  const divs = divEvents
    .filter((d) => d && d.amount > 0 && d.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 12)
    .map((d) => ({ amount: round(d.amount, 4), ex: new Date(d.date * 1000).toISOString().slice(0, 10) }));
  return {
    price: round(price, 2),
    high: round(high, 2),
    low: round(low, 2),
    asOf: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
    type: m.instrumentType || null, // "ETF", "MUTUALFUND", "EQUITY"
    divs,
  };
}

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

async function isSignedIn(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const base = Deno.env.get("SUPABASE_URL");
  const key = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!base || !/^Bearer\s+ey/i.test(auth)) return false; // user tokens are JWTs; a bare publishable key isn't
  try {
    const r = await fetch(`${base}/auth/v1/user`, { headers: { authorization: auth, apikey: key } });
    return r.ok;
  } catch {
    return false;
  }
}
