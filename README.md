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

The project URL and publishable key are in `index.html`. Both are safe to publish; never put the secret or service_role key there.
