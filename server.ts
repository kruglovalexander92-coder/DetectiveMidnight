/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getLLMProvider, checkDependencies } from "./src/server/llm/provider.js";
import { llmConfig } from "./src/server/llm/config.js";
import { createEmptyState, startRound, processTurn, generateOptions, askQuestion, updatePlayerComposite, type RoundState } from "./src/server/npc-game/game/engine.js";
import { config as npcConfig } from "./src/server/npc-game/config.js";
import type { CaseQuestionType, PhotoCompositeFeatures } from "./src/server/npc-game/model/types.js";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development", llmProvider: llmConfig.provider });
});

// POST /api/writer/generate - Generates a custom single job or story campaign
app.post("/api/writer/generate", async (req, res) => {
  try {
    const { type, idea } = req.body;
    if (!idea || typeof idea !== "string" || idea.trim() === "") {
      res.status(400).json({ error: "Идея рассказа не может быть пустой" });
      return;
    }

    const provider = await getLLMProvider();
    const result = await provider.generateStory(idea, type);

    res.json(result);
  } catch (error: any) {
    console.error("Error generating custom story:", error);
    res.status(500).json({ error: error.message || "Ошибка при генерации рассказа" });
  }
});

// POST /api/writer/critique - Critiques a custom pulp novel based on completed campaign/case
app.post("/api/writer/critique", async (req, res) => {
  try {
    const { idea, title, chapters, ratingIdea, ratingExecution } = req.body;
    if (!idea) {
      res.status(400).json({ error: "Missing campaign idea for critique" });
      return;
    }

    const provider = await getLLMProvider();
    const result = await provider.critiqueStory(idea, title || '', chapters || [], ratingIdea || 0, ratingExecution || 0);

    res.json(result);
  } catch (error: any) {
    console.error("Error critiquing story:", error);
    res.status(500).json({ error: error.message || "Ошибка при рецензировании книги" });
  }
});

// NEURO NPCs API ROUTES
const npcSessions = new Map<string, RoundState>();

app.post("/api/npc/round/start", async (req, res) => {
  try {
    const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const state = createEmptyState();
    const result = await startRound(state);
    
    npcSessions.set(sessionId, state);
    
    res.json({
      sessionId,
      npc: result.npc,
      inventory: result.inventory,
      relationship: result.relationship,
      turn: result.turn,
      caseQuestions: result.caseQuestions,
      thresholds: { q1: npcConfig.relQ1, q2: npcConfig.relQ2, q3: npcConfig.relQ3, q4: npcConfig.relQ4 },
    });
  } catch (error: any) {
    console.error("Error starting round:", error);
    res.status(500).json({ error: error.message || "Failed to start round" });
  }
});

app.post("/api/npc/turn", async (req, res) => {
  try {
    const { sessionId, playerText, gaveItem } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    
    const state = npcSessions.get(sessionId);
    if (!state) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    
    if (state.outcome) {
      res.status(400).json({ error: "Round already ended", outcome: state.outcome });
      return;
    }
    
    const result = await processTurn(state, playerText || "", gaveItem || null);
    
    res.json(result);
  } catch (error: any) {
    console.error("Error processing turn:", error);
    res.status(500).json({ error: error.message || "Failed to process turn" });
  }
});

app.post("/api/npc/options", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    
    const state = npcSessions.get(sessionId);
    if (!state) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    
    if (state.outcome) {
      res.status(400).json({ error: "Round already ended", outcome: state.outcome });
      return;
    }
    
    const options = await generateOptions(state);
    
    res.json({ options });
  } catch (error: any) {
    console.error("Error generating options:", error);
    res.status(500).json({ error: error.message || "Failed to generate options" });
  }
});

app.post("/api/npc/ask", async (req, res) => {
  try {
    const { sessionId, questionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    
    if (!questionId || !["hair", "eyes", "mustache", "skin", "compare"].includes(questionId)) {
      res.status(400).json({ error: "Invalid questionId. Must be one of: hair, eyes, mustache, skin, compare" });
      return;
    }
    
    const state = npcSessions.get(sessionId);
    if (!state) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    
    if (state.outcome) {
      res.status(400).json({ error: "Round already ended", outcome: state.outcome });
      return;
    }
    
    const result = await askQuestion(state, questionId as CaseQuestionType);
    
    res.json(result);
  } catch (error: any) {
    console.error("Error asking question:", error);
    res.status(500).json({ error: error.message || "Failed to ask question" });
  }
});

app.post("/api/npc/composite/update", async (req, res) => {
  try {
    const { sessionId, feature, value } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    
    if (!feature || !["hair", "eyes", "mustache", "skin"].includes(feature)) {
      res.status(400).json({ error: "Invalid feature. Must be one of: hair, eyes, mustache, skin" });
      return;
    }
    
    if (!value) {
      res.status(400).json({ error: "Missing value" });
      return;
    }
    
    const validValues: Record<string, string[]> = {
      hair: ["bald", "short", "curly", "tophat"],
      eyes: ["glasses", "angry", "normal", "monocle"],
      mustache: ["none", "gentleman", "beard", "pirate"],
      skin: ["pale", "tanned", "fair"],
    };
    
    if (!validValues[feature]?.includes(value)) {
      res.status(400).json({ error: `Invalid value for ${feature}. Must be one of: ${validValues[feature].join(", ")}` });
      return;
    }
    
    const state = npcSessions.get(sessionId);
    if (!state) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    
    updatePlayerComposite(state, feature as keyof PhotoCompositeFeatures, value);
    
    res.json({ playerComposite: state.npc.playerComposite });
  } catch (error: any) {
    console.error("Error updating composite:", error);
    res.status(500).json({ error: error.message || "Failed to update composite" });
  }
});

// START EXPRESS + VITE SERVER
async function startServer() {
  // Check LLM provider dependencies
  try {
    await checkDependencies(llmConfig.provider);
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`LLM Provider: ${llmConfig.provider}`);
  });
}

startServer();
