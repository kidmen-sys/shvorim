export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const { image, type = "image/jpeg" } = body;
  if (!image) return new Response("No image", { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

  const prompt = `אתה מנתח שוברי קנייה ישראלים. בדוק את התמונה וחלץ:
1. קוד השובר (מספרים/אותיות, לרוב 8-16 תווים)
2. תאריך תוקף (בפורמט YYYY-MM-DD)
3. ערך ההנחה (למשל "₪50 הנחה" או "20% הנחה")

החזר JSON בדיוק כך (ללא כלום נוסף):
{"code":"...","expiry":"YYYY-MM-DD","discount":"..."}

אם לא מצאת ערך מסוים, שים ריק: "".`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: type, data: image } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: err }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || "{}";

    // parse JSON from response
    const match = text.match(/\{[^}]+\}/);
    const result = match ? JSON.parse(match[0]) : { code: "", expiry: "", discount: "" };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
