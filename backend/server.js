import express from "express";

const app = express();
app.use(express.json());

// 允许 GitHub Pages 调用（CORS）
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message ?? "").trim();
    if (!message) return res.status(400).json({ error: "Empty message" });

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing MINIMAX_API_KEY" });

    const resp = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-M2.1",
        messages: [
          { role: "system", name: "system", content: "You are a helpful assistant." },
          { role: "user", name: "user", content: message }
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: "MiniMax error", detail: data });

    const reply = data?.choices?.[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API listening on", port));
