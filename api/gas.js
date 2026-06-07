// Vercel Serverless Function - GAS 프록시
// 위치: 프로젝트 루트의 /api/gas.js
 
const GAS_URL = process.env.GAS_URL || "";
 
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
 
  if (!GAS_URL) {
    return res.status(500).json({ ok: false, msg: "GAS_URL 환경변수가 설정되지 않았습니다." });
  }
 
  try {
    let response, text;
 
    if (req.method === "GET") {
      const params = new URLSearchParams(req.query).toString();
      const url    = params ? `${GAS_URL}?${params}` : GAS_URL;
      response = await fetch(url, { redirect: "follow" });
      text     = await response.text();
 
    } else if (req.method === "POST") {
      response = await fetch(GAS_URL, {
        method:  "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body:    JSON.stringify(req.body),
      });
      text = await response.text();
 
    } else {
      return res.status(405).json({ ok: false, msg: "Method Not Allowed" });
    }
 
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).send(text);
    }
 
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
};
 
