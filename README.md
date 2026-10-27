# Tick Trader website

The public site of Tick Trader ($TICK), an AI quant desk trading tokenized US stocks on BNB Chain:
the live desk (orders, P&L, positions, the index allocation, the AI's notes) and holder dividends.

Vite + React + TypeScript, plain static output. Routes use the URL hash, so no server rewrites are needed.

```
npm install
npm run dev      # http://localhost:5190, /api proxied to 127.0.0.1:8790
npm run build    # static files in dist/
```

## Deploy (Vercel)

Framework preset Vite, build command `npm run build`, output directory `dist`.

## Settings

Set in `.env.production` or as environment variables in Vercel (those take precedence). All are public.

| Variable | Meaning |
| --- | --- |
| `VITE_SITE_URL` | Site origin, for link previews, e.g. `https://ticktrader.xyz` |
| `VITE_API_BASE` | The desk bot's API, e.g. `https://api.ticktrader.xyz` |
| `VITE_TICK_TOKEN` | $TICK token address, once launched |
| `VITE_VAULT` | Desk vault address, once deployed |
| `VITE_DESK` | Dividend desk address, once deployed |
| `VITE_BUY_URL` | Where "Buy $TICK" leads (defaults to gang.fun) |
| `VITE_X_URL` | The project's X profile (the link is hidden until set) |
| `VITE_RPC` | BNB Chain RPC for dividend claims (defaults to the public dataseed) |
