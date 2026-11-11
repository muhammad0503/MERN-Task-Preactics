import { GoogleGenAI } from '@google/genai';

/**
 * Service to interact with the Google Gemini LLM API.
 * Phase 1 constraints:
 * - Stateless: Sends only the current user message (No conversation memory/history).
 * - No tool use, task access, or streaming.
 */
export const generateReply = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or not configured in backend .env');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Preferred fast conversational models
  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter(Boolean);

  let lastError = null;

  for (const model of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: message,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Model ${model} request notice:`, err.message?.slice(0, 80));
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'Failed to generate response from Gemini API.');
};
