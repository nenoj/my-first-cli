import express from "express";
import { execFile } from "child_process";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));


function refactorPrompt(code, instructions) {
  return `
You are a refactoring tool.

Rules:
- Output ONLY a unified git diff
- The diff MUST start with: diff --git a/file.txt b/file.txt
- Include index line
- Do NOT explain anything
- Do NOT include markdown fences
- Assume filename is file.txt

Instructions:
${instructions}

Original code:
---
${code}
`.trim();
}

import { spawn } from "child_process";

function runAI(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn("ai", [], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    child.stdout.on("data", d => output += d);
    child.stderr.on("data", d => error += d);

    child.on("close", code => {
      if (code !== 0) {
        return reject(error || `Exited with code ${code}`);
      }
      resolve(output);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

app.post("/api/ask", async (req, res) => {
  console.log(">>> /api/ask hit", req.body);
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const output = await runAI(prompt);
    console.log(">>> sending response");
    res.json({ output });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.post("/api/refactor", async (req, res) => {
  const { code, instructions } = req.body;

  if (!code || !instructions) {
    return res.status(400).json({
      error: "code and instructions are required",
    });
  }

  console.log(">>> /api/refactor hit");

  try {
    let diff = await runAI(refactorPrompt(code, instructions));

    // 🔒 Normalize diff: ensure newline at EOF
    diff = diff.replace(/\s*$/, "\n");

    // 🧪 Optional sanity check
    if (!diff.startsWith("diff --git")) {
      diff =
        `diff --git a/file.txt b/file.txt\n` +
        `index 0000000..1111111 100644\n` +
        diff;
    }

    res.json({ diff });
  } catch (err) {
    console.error("refactor error:", err);
    res.status(500).json({ error: err.toString() });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

