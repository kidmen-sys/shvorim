export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { base64, mediaType } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 }
            },
            {
              type: "text",
              text: `תמונת שובר קופון ישראלי. חלץ את הפרטים וחזור JSON בלבד ללא markdown:
{"code":"מספר השובר המלא כולל מקפים לדוגמה 11111111111-2222","expiry":"YYYY-MM-DD","discount":"סכום או הטבה"}
חוקים: קוד = כל הספרות והסימנים ביניהם. תאריך יכול להיות DD/MM/YYYY או DD.MM.YYYY - המר ל-YYYY-MM-DD. שדה לא קיים = ריק.`
            }
          ]
        }]
      }),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
