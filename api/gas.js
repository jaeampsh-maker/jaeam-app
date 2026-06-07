// Vercel API Route: /api/gas
// 앱(브라우저) → Vercel /api/gas → GAS
// CORS 문제 완전 해결 - 서버사이드에서 GAS 호출

const GAS_URL = process.env.GAS_URL || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!GAS_URL) {
    return res.status(500).json({ ok: false, msg: "GAS_URL 환경변수 미설정" });
  }

  try {
    let gasRes, text;

    if (req.method === "GET") {
      const params = new URLSearchParams(req.query).toString();
      gasRes = await fetch(`${GAS_URL}?${params}`, { redirect: "follow" });
      text   = await gasRes.text();
    } else {
      gasRes = await fetch(GAS_URL, {
        method:   "POST",
        redirect: "follow",
        headers:  { "Content-Type": "text/plain;charset=utf-8" },
        body:     JSON.stringify(req.body),
      });
      text = await gasRes.text();
    }

    try   { return res.status(200).json(JSON.parse(text)); }
    catch { return res.status(200).send(text); }

  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
}
