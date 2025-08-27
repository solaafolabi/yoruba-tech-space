// src/api/grade-webhook.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // ✅ standardize on 5000

app.use(cors());
app.use(express.json());

// 🔑 Supabase with SERVICE ROLE (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/api/final-project", async (req, res) => {
  console.log("Received request body:", req.body);
  const { repoUrl, student_id, course_id } = req.body;

  if (!repoUrl || !student_id || !course_id) {
    return res.status(400).json({ error: "Missing repoUrl, student_id or course_id" });
  }

  try {
    // --- GitHub Auto Check ---
    const parts = repoUrl.split("github.com/")[1]?.split("/");
    if (!parts || parts.length < 2) return res.json({ score: 0 });

    const [owner, repo] = parts;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const repoRes = await fetch(apiUrl);
    if (!repoRes.ok) return res.json({ score: 0 });
    const repoData = await repoRes.json();

    let score = 0;
    if (repoData.size > 0) score += 30;
    if (repoData.forks_count >= 0) score += 20;
    if (repoData.open_issues_count >= 0) score += 10;

    const readmeRes = await fetch(apiUrl + "/readme");
    if (readmeRes.ok) score += 20;

    const commitsRes = await fetch(apiUrl + "/commits");
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      if (commits.length > 2) score += 20;
    }

    const finalScore = Math.min(score, 100);
    console.log("Calculated score:", finalScore);

    // --- Save to Supabase ---
    const { error } = await supabase.from("student_assignments").insert([
      {
        student_id,
        course_id,
        repo_url: repoUrl,
        auto_score: finalScore,
        status: finalScore >= 70 ? "auto_passed" : "needs_review",
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save assignment" });
    }

    return res.json({
      success: true,
      score: finalScore,
      status: finalScore >= 70 ? "auto_passed" : "needs_review",
    });
  } catch (err) {
    console.error("Auto-check error:", err);
    return res.status(500).json({ score: 0, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Node backend running on http://localhost:${PORT}`);
});
