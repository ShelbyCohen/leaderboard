// ============================================================
//  Good Boy Points — SMS notifier (Cloudflare Worker)
//  Texts the OTHER guys when someone scores points.
//
//  Set these in Cloudflare → your Worker → Settings → Variables:
//    TWILIO_SID    - Twilio Account SID (starts with "AC…")
//    TWILIO_TOKEN  - Twilio Auth Token          (mark as "Secret")
//    TWILIO_FROM   - your Twilio number, e.g. +18885551234
//    SHARED_KEY    - any password; must match NOTIFY_KEY in index.html
//    PHONES        - JSON map of name → number, e.g.
//                    {"Matt":"+1555...","Brian":"+1555...","Austin":"+1555...","Quint":"+1555..."}
// ============================================================

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

    const { key, scorer, pts, reason } = body || {};
    if (key !== env.SHARED_KEY) return json({ error: 'unauthorized' }, 401, cors);
    if (!scorer || !(pts > 0)) return json({ error: 'nothing to send' }, 400, cors);

    let phones = {};
    try { phones = JSON.parse(env.PHONES || '{}'); } catch {}

    const msg = `🎀 Good Boy Points: ${scorer} just ${reason} (+${pts})! Don't let him run away with the crown 👑`;

    // everyone except the scorer
    const recipients = Object.entries(phones)
      .filter(([name]) => name.toLowerCase() !== String(scorer).toLowerCase());

    const sent = [];
    for (const [name, number] of recipients) {
      const r = await sendSms(env, number, msg);
      sent.push({ name, ok: r.ok });
    }
    return json({ sent }, 200, cors);
  }
};

async function sendSms(env, to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: body });
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
