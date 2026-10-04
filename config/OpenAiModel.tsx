import OpenAI from "openai";

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is missing in .env.local!");
}

export const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: apiKey || "dummy-key-for-vercel-build",
});

// Override with GEMINI_MODEL when deploying against a different available model.
export const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";