// Vercel Serverless Function - GAS 프록시
module.exports = async function handler(req, res) {
  // ── CORS 헤더 (모든 요청에 적용) ──
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age",       "86400");

  // Preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const GAS_URL = process.env.GAS_URL;
  if (!GAS_URL) {
    return res.status(500).json({ ok: false, msg: "GAS_URL 환경변수 미설정" });
  }

  try {
    let gasRes, text;

    if (req.method === "GET") {
      const params = new URLSearchParams(req.query).toString();
      const url    = params ? `${GAS_URL}?${params}` : GAS_URL;
      gasRes = await fetch(url, { redirect: "follow" });
      text   = await gasRes.text();

    } else if (req.method === "POST") {
      const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      gasRes = await fetch(GAS_URL, {
        method:  "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body:    body,
      });
      text = await gasRes.text();

    } else {
      return res.status(405).json({ ok: false, msg: "Method Not Allowed" });
    }

    // JSON 파싱 시도
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      // JSON이 아니면 그냥 텍스트로
      return res.status(200).send(text);
    }

  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
};
