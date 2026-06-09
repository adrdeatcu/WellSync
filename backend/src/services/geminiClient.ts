// src/services/geminiClient.ts
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ??
  'https://generativelanguage.googleapis.com/v1beta';

const GEMINI_API_KEY_ENV = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY_ENV) {
  throw new Error('GEMINI_API_KEY is not set in environment');
}

// Non-null string used below
const GEMINI_API_KEY: string = GEMINI_API_KEY_ENV;

export async function generateText(prompt: string): Promise<string> {
  const url = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY,
  )}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No Authorization header needed when using API key mode
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return text;
}