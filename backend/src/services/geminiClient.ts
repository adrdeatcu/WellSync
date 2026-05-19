// src/services/geminiClient.ts
import dotenv from 'dotenv';
import { GoogleAuth } from 'google-auth-library';

dotenv.config();

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';

// Scope for generative language on Google Cloud / Agent Platform
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

const auth = new GoogleAuth({
  scopes: SCOPES,
});

export async function generateText(prompt: string): Promise<string> {
  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  const accessToken = accessTokenResponse.token;
  if (!accessToken) {
    throw new Error('Failed to obtain access token for Gemini API');
  }

  const url = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
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