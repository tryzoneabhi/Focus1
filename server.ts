import express from "express";
import { createServer as createViteServer } from "vite";
import { getRecommendations, summarizeVideo } from "./src/services/aiService.ts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { profile, history } = req.body;
      const data = await getRecommendations(profile, history);
      res.json(data);
    } catch (error) {
      console.error("AI Recommendation error:", error);
      res.status(500).json({ error: "AI Recommendation failed" });
    }
  });

  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { title, description } = req.body;
      const summary = await summarizeVideo(title, description);
      res.json({ summary });
    } catch (error) {
      console.error("AI Summary error:", error);
      res.status(500).json({ error: "AI Summary failed" });
    }
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
