# 📲 Turning on SMS notifications

When a guy scores points, the app can text **all the other guys** to keep the
competition hot. This needs two free/cheap accounts + a one-time carrier
registration. Budget ~30 min of setup, plus a few days waiting on step 2.

Architecture: **App (GitHub Pages)** → **Cloudflare Worker** → **Twilio** → 📱

---

## 1. Twilio account + phone number
1. Sign up at <https://www.twilio.com/try-twilio>.
2. Buy a phone number (Console → Phone Numbers → Buy a number, ~$1–2/mo).
3. From the Console dashboard, copy your **Account SID** (`AC…`) and **Auth Token**.
4. **Set a spending cap** (Console → Billing → Settings) so a bug or abuse can't
   run up a bill. $5–10 is plenty for a friend group.

## 2. Register for A2P 10DLC  ⚠️ required for US texting
US carriers block app-sent texts unless the number is registered.
- Console → Messaging → **Regulatory Compliance → A2P 10DLC**.
- Choose the **Standard / low-volume** brand + campaign. Small one-time fees
  (~$4 brand + ~$2/mo campaign). Approval usually takes 1–3 days.
- Until this is approved, texts may not deliver.

## 3. Deploy the Cloudflare Worker
1. Sign up at <https://dash.cloudflare.com> (free).
2. **Workers & Pages → Create → Create Worker**. Name it e.g. `goodboy-sms`.
3. Click **Edit code**, delete the sample, paste the entire contents of
   [`sms-worker.js`](./sms-worker.js), then **Deploy**.
4. Open the Worker → **Settings → Variables and Secrets** and add:
   | Name | Value | Type |
   |------|-------|------|
   | `TWILIO_SID` | your `AC…` SID | Text |
   | `TWILIO_TOKEN` | your auth token | **Secret** |
   | `TWILIO_FROM` | your Twilio number, e.g. `+18885551234` | Text |
   | `SHARED_KEY` | any password you make up | **Secret** |
   | `PHONES` | `{"Matt":"+1...","Brian":"+1...","Austin":"+1...","Quint":"+1..."}` | Text |
5. **Deploy** again to apply, then copy the Worker URL
   (looks like `https://goodboy-sms.<you>.workers.dev`).

## 4. Point the app at the Worker
In `index.html`, near the top of the `<script>`:
```js
const NOTIFY_URL = 'https://goodboy-sms.<you>.workers.dev'; // paste your URL
const NOTIFY_KEY = 'the-same-password-you-set-as-SHARED_KEY';
```
Commit + push. Done — scoring now texts the other guys. 🎉

---

## Notes
- **Numbers stay private:** they live only in the Worker, never in the app.
- **One caveat:** `NOTIFY_KEY` is visible in the page source, so anyone who finds
  your app URL *could* trigger texts. That's why the Twilio spend cap (step 1.4)
  matters. For a private friend group this is low risk.
- Message text lives in `sms-worker.js` (the `msg` line) — edit freely.
