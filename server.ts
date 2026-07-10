/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Lazy-initialize Gemini Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Helper for robust Gemini content generation with retries, model fallback, and high-quality local fallbacks
async function generateContentWithFallback(
  ai: GoogleGenAI,
  model: string,
  contents: any,
  config: any,
  fallbackGenerator: () => any
): Promise<any> {
  const modelsToTry = [model, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    // Retry up to 2 times for each model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Attempting ${currentModel} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
        const text = response.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch (parseErr) {
            console.error("[Gemini] Parse error, trying to extract JSON codeblock...", parseErr);
            // Fallback parse if it returned markdown wrapped JSON
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanText);
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Error on ${currentModel} (attempt ${attempt}):`, err.message || err);
        // Wait 800ms before retry
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  // If all attempts and models failed, run fallback generator!
  console.error("[Gemini] All models and retries exhausted. Using robust local fallback. Last error was:", lastError);
  return fallbackGenerator();
}

// POST /api/writer/generate - Generates a custom single job or story campaign
app.post("/api/writer/generate", async (req, res) => {
  try {
    const { type, idea } = req.body;
    if (!idea || typeof idea !== "string" || idea.trim() === "") {
      res.status(400).json({ error: "Идея рассказа не может быть пустой" });
      return;
    }

    const ai = getAiClient();

    if (type === "single") {
      const prompt = `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта. 
Напиши увлекательное детективное задание на основе идеи пользователя. 
Идея пользователя: "${idea}"
Развей эту идею в полноценное дело для кота и детектива. Текст должен быть на русском языке, в атмосферном, слегка ироничном нуарном стиле.`;

      const result = await generateContentWithFallback(
        ai,
        "gemini-3.5-flash",
        prompt,
        {
          systemInstruction: "Ты создаешь детективные дела для игры. Ответ должен строго соответствовать заданной схеме JSON на русском языке. Используй классический нуарный слог с юмором.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Название дела на русском (например, 'Дело о похищенной сосиске')" },
              caseName: { type: Type.STRING, description: "Краткий префикс с номером дела (например, 'Дело №74: «...»')" },
              description: { type: Type.STRING, description: "Красочное, атмосферное описание дела (2-3 предложения), связывающее идею пользователя, кота Миднайта и сыщика Ванса." },
              reward: { type: Type.INTEGER, description: "Награда в долларах за раскрытие (от 200 до 450)" },
              risk: { type: Type.STRING, description: "Уровень риска: 'low', 'medium' или 'high'" },
              roomTemplateId: { type: Type.STRING, description: "Одна из комнат для расследования. Выбери наиболее подходящую по контексту из списка: 'room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'." }
            },
            required: ["title", "caseName", "description", "reward", "risk", "roomTemplateId"]
          }
        },
        () => {
          const rooms = ["room_antique", "room_ballerina", "room_mansion", "room_shop", "room_museum"];
          const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
          const randomReward = Math.floor(Math.random() * 250) + 200;
          const risks = ["low", "medium", "high"];
          const randomRisk = risks[Math.floor(Math.random() * risks.length)];
          const caseId = Math.floor(Math.random() * 90) + 10;
          
          return {
            title: `Дело о ${idea.slice(0, 30).toLowerCase()}`,
            caseName: `Дело №${caseId}: «Шорохи Лондона»`,
            description: `Сыщик Ванс и его верный напарник кот Миднайт приступают к расследованию. Поступили сведения: "${idea}". Следы уводят нас в тень лондонских закоулков...`,
            reward: randomReward,
            risk: randomRisk,
            roomTemplateId: randomRoom
          };
        }
      );

      res.json(result);
    } else {
      // type === "campaign"
      const prompt = `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта.
Напиши захватывающий бульварный детективный роман, состоящий из 3, 4 или 5 последовательных связанных глав-расследований на основе идеи пользователя. Выбери наиболее подходящее количество глав в этом диапазоне (3, 4 или 5), чтобы полностью раскрыть сюжет.
Идея пользователя: "${idea}"
Развей идею в сквозную историю, состоящую из последовательных связанных глав-расследований. Текст должен быть на русском языке в атмосферном нуарном стиле.`;

      const result = await generateContentWithFallback(
        ai,
        "gemini-3.5-flash",
        prompt,
        {
          systemInstruction: "Ты создаешь детективный бульварный роман, состоящий из 3-5 связанных глав-дел. Каждая глава — это полноценное дело. Ответ должен строго соответствовать заданной схеме JSON на русском языке (массив из 3-5 объектов). Используй классический нуарный слог.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Массив из 3-5 связанных глав детективного бульварного романа",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Название главы на русском" },
                caseName: { type: Type.STRING, description: "Название главы (например, 'Глава I: Подозрительный след')" },
                description: { type: Type.STRING, description: "Атмосферное описание главы (2-3 предложения), продвигающее сюжет романа вперед." },
                reward: { type: Type.INTEGER, description: "Награда в долларах. Глава 1: 200-250, последующие главы: 250-400, финальная глава: 450-550" },
                risk: { type: Type.STRING, description: "Уровень риска: 'low', 'medium' или 'high'" },
                roomTemplateId: { type: Type.STRING, description: "Подходящая комната из списка: 'room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'." }
              },
              required: ["title", "caseName", "description", "reward", "risk", "roomTemplateId"]
            }
          }
        },
        () => {
          const rooms = ["room_antique", "room_ballerina", "room_mansion", "room_shop", "room_museum"];
          return [
            {
              title: "Туманный след",
              caseName: "Глава I: Странные слухи",
              description: `В лондонские доки приходят загадочные известия о "${idea}". Кот Миднайт навострил уши.`,
              reward: 220,
              risk: "low",
              roomTemplateId: rooms[0]
            },
            {
              title: "Опасная встреча",
              caseName: "Глава II: В тени собора",
              description: `Расследование идеи "${idea}" принимает серьезный оборот. Вансу угрожает банда головорезов, но Миднайт всегда начеку.`,
              reward: 320,
              risk: "medium",
              roomTemplateId: rooms[1 % rooms.length]
            },
            {
              title: "Финальное разоблачение",
              caseName: "Глава III: Лицо врага",
              description: `Завершающий аккорд нашей повести о "${idea}". Истина открыта, преступник пойман, лондонские газеты ликуют!`,
              reward: 500,
              risk: "high",
              roomTemplateId: rooms[2 % rooms.length]
            }
          ];
        }
      );

      res.json({ chapters: result });
    }
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

    const ai = getAiClient();
    const campaignDetails = (chapters || []).map((ch: any, idx: number) => 
      `Глава ${idx + 1}: "${ch.title}" - ${ch.description}`
    ).join("\n");

    const prompt = `Ты — строгий, но склонный к сарказму лондонский литературный критик из 1930-х годов, пишущий рецензии на дешевые детективные романы (pulp fiction).
Оцени новый бульварный детективный роман, основанный на идее автора: "${idea}".
Сюжет романа развивался по следующим главам:
${campaignDetails || `Дело: "${title}"`}

Автор романа оценил свою первоначальную идею на ${ratingIdea} из 5 звезд, а исполнение сюжета соавтором-ИИ на ${ratingExecution} из 5 звезд.
Напиши рецензию в стиле критической колонки в лондонском литературном вестнике, наполненную нуарным сарказмом, забавными метафорами и профессиональной оценкой. Рецензия должна быть строго на русском языке.
Определи статус книги на книжном рынке Лондона:
- 'flop' (провал: мало продаж, рецензенты смеются, тираж пустили на растопку каминов)
- 'hit' (хит: неплохие продажи, усатый сыщик Midnight полюбился публике, роман обсуждают в пабах Сохо)
- 'bestseller' (бестселлер: феноменальный успех, у дверей издательства очереди, дамы падают в обморок от интриги)
Если средняя оценка автора высокая (4-5), книга должна стать 'hit' или 'bestseller'. Если низкая (1-3), сделай ее 'flop'.
Также определи гонорар автора (profit) от продаж: провал приносит от 10$ до 30$, хит от 150$ до 250$, бестселлер от 350$ до 500$.`;

    const result = await generateContentWithFallback(
      ai,
      "gemini-3.5-flash",
      prompt,
      {
        systemInstruction: "Ты литературный критик 1930-х годов. Напиши колоритную саркастичную рецензию на дешевый детективный роман по предложенной схеме JSON на русском языке.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Смешное, интригующее название изданного бульварного романа на русском (например, 'Кот, который знал слишком мало')" },
            status: { type: Type.STRING, description: "Статус книги: 'flop', 'hit' или 'bestseller'" },
            profit: { type: Type.INTEGER, description: "Полученный гонорар писателя в долларах ($)" },
            review: { type: Type.STRING, description: "Текст литературной рецензии на русском языке (4-5 атмосферных предложений), критикующий идею и реализацию с юмором." }
          },
          required: ["title", "status", "profit", "review"]
        }
      },
      () => {
        const ratingI = ratingIdea !== undefined ? parseFloat(ratingIdea) : 4;
        const ratingE = ratingExecution !== undefined ? parseFloat(ratingExecution) : 4;
        const averageRating = (ratingI + ratingE) / 2;
        const isHigh = averageRating >= 3.5;
        const status = isHigh ? (averageRating >= 4.5 ? "bestseller" : "hit") : "flop";
        const profit = status === "flop" ? 25 : (status === "hit" ? 210 : 450);
        const cleanTitle = title || `Загадка "${idea.slice(0, 30)}"`;

        return {
          title: cleanTitle,
          status,
          profit,
          review: `«${cleanTitle}» — весьма колоритное бульварное чтиво! Автор взял за основу интригующий концепт "${idea}". Профессиональный рецензент отметил превосходный юмор, потрясающую атмосферу туманного Альбиона и харизму пушистого сыщика.`
        };
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error critiquing story:", error);
    res.status(500).json({ error: error.message || "Ошибка при рецензировании книги" });
  }
});

// START EXPRESS + VITE SERVER
async function startServer() {
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
  });
}

startServer();
