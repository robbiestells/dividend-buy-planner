# Dividend Buy Planner

A planner for building a monthly-income portfolio. Set up your holdings from a screenshot or by searching, then get:

- A recommended order for each month's buy (new money plus distributions), built one share at a time
- Sector targets you control, with drift charts and buy or trim recommendations
- Total return per holding from your average cost and distributions received
- A projection of monthly income toward your goal

Live: https://robbiestells.github.io/dividend-buy-planner/

Screenshot import runs on your device with text recognition (Tesseract.js). Not financial advice.

## Where data lives

Sign in with an email link to keep your holdings, purchases and dividend history in sync on every device. Data is stored in Supabase (the same project as Mise en Place), and row-level security keeps each person's data private. The browser also keeps a copy so the planner opens instantly and works offline; when two devices disagree, the most recent change wins. Without signing in, everything stays in the browser you use.

## Setting up account sync (one time)

1. In the Supabase project, open **SQL Editor**, paste [`supabase/planner.sql`](supabase/planner.sql), and run it.
2. Open **Authentication → URL Configuration** and add `https://robbiestells.github.io/dividend-buy-planner/` under **Redirect URLs**. Leave the Site URL as it is.
3. Deploy the price checker: open **Edge Functions → Deploy a new function → Via Editor**, name it `fund-quotes`, replace the sample code with [`supabase/functions/fund-quotes/index.ts`](supabase/functions/fund-quotes/index.ts), and deploy with **Verify JWT** left on. It only answers signed-in users, so it can't be used as an open proxy.

## Prices

Built-in prices are a snapshot. Tap **Check for new prices** (Funds tab, or the prompt on the Buy tab when prices are behind) to pull the latest price, 52-week range, and the last year of payouts with ex-dates from Yahoo Finance through the `fund-quotes` function. ETFs and stocks trade 9:30 a.m.–4 p.m. ET; mutual funds such as FSPTX post one price a day, usually by about 6 p.m. ET.

## Distributions by fund

The Returns tab keeps a per-fund log. Once a fund you hold passes its ex-dividend date, the planner logs an estimate (shares × recent per-share payout, or the actual payout once prices have been checked). Type the amount from your broker to confirm it, or add past distributions by hand. Total return uses this log.

The project URL and publishable key are in `index.html`. Both are safe to publish; never put the secret or service_role key there.
