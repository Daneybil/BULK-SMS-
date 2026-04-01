import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real Scraping API
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url, countryCode } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`Scraping URL: ${url} for country: ${countryCode}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true, // Handle all status codes
      });

      if (response.status !== 200) {
        return res.status(response.status).json({ error: `Failed to fetch the website. Status code: ${response.status}` });
      }

      const html = response.data;
      if (typeof html !== 'string') {
        return res.status(500).json({ error: "Received invalid data from the website." });
      }

      // Robust regex for phone numbers
      // This looks for numbers like +234 803 123 4567, 08031234567, +1-234-567-8901, etc.
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
      const matches = html.match(phoneRegex) || [];
      
      // Clean and filter duplicates
      let uniqueNumbers = Array.from(new Set(matches.map((num: string) => num.replace(/[^\d+]/g, ''))));
      
      // Filter by country code if provided
      if (countryCode && countryCode !== 'All Countries') {
        const code = countryCode.match(/\+(\d+)/)?.[1];
        if (code) {
          uniqueNumbers = uniqueNumbers.filter((num: string) => num.startsWith(`+${code}`) || num.startsWith(code));
        }
      }

      // Ensure they look like real numbers (at least 7 digits)
      uniqueNumbers = uniqueNumbers.filter((num: string) => num.length >= 7);

      // Ensure they start with +
      uniqueNumbers = uniqueNumbers.map(num => num.startsWith('+') ? num : '+' + num);

      console.log(`Found ${uniqueNumbers.length} numbers`);
      res.json({ numbers: uniqueNumbers });
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: error.message || "An unexpected error occurred during scraping." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
