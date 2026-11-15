// Vercel Serverless Function. API key থাকে শুধু এখানে (Environment Variable: FAL_KEY)
const APP = 'fal-ai/kling-video';
const MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const KEY = process.env.FAL_KEY;
const H = { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' };

export default async function handler(req, res) {
  if (!KEY) return res.status(500).json({ error: 'সার্ভারে FAL_KEY সেট করা নেই' });
  try {
    if (req.method === 'POST') {
      const prompt = String(req.body?.prompt || '').slice(0, 1000);
      if (!prompt) return res.status(400).json({ error: 'প্রম্পট খালি' });
      const r = await fetch(`https://queue.fal.run/${MODEL}`, {
        method: 'POST', headers: H, body: JSON.stringify({ prompt, duration: '5' })
      });
      const j = await r.json();
      if (!r.ok) return res.status(502).json({ error: 'ভিডিও সার্ভিস রিকোয়েস্ট নেয়নি (ক্রেডিট আছে কিনা দেখুন)' });
      return res.status(200).json({ id: j.request_id });
    }
    if (req.method === 'GET') {
      const id = String(req.query.id || '');
      if (!/^[\w-]{8,64}$/.test(id)) return res.status(400).json({ error: 'ভুল id' });
      const s = await (await fetch(`https://queue.fal.run/${APP}/requests/${id}/status`, { headers: H })).json();
      if (s.status === 'COMPLETED') {
        const out = await (await fetch(`https://queue.fal.run/${APP}/requests/${id}`, { headers: H })).json();
        const url = out?.video?.url;
        if (!url) return res.status(502).json({ error: 'ভিডিও তৈরি হয়নি' });
        return res.status(200).json({ status: 'done', url });
      }
      return res.status(200).json({ status: 'pending' });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: 'সার্ভারে সমস্যা হয়েছে' });
  }
}
