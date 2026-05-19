// src/services/coachService.ts
import { generateText } from './geminiClient.js';

export interface CoachContext {
  // Profile info
  name?: string | undefined;
  age?: number | undefined;
  activityLevel?: string | undefined;
  stepGoalPerDay?: number | undefined;

  // Today stats
  stepsToday?: number | undefined;
  avgHeartRateToday?: number | undefined;
  maxHeartRateToday?: number | undefined;

  // History (e.g., last 7 days)
  avgStepsLast7Days?: number | undefined;
  avgHeartRateLast7Days?: number | undefined;

  // Optional user‑provided info
  mood?: string | undefined;
  sleepHours?: number | undefined;
  notes?: string | undefined;

  // New: what the user actually asked in this request
  question?: string | undefined;
}

export interface CoachAdvice {
  summary: string;
  actionSteps: string[];
}

/**
 * Builds a wellness‑coach style prompt from the user's context
 * and calls Gemini to get advice.
 */
export async function getDailyCoachAdvice(
  userId: string,
  context: CoachContext,
  mode: 'daily' | 'question' = 'daily'
): Promise<CoachAdvice> {
  const prompt = buildCoachPrompt(userId, context, mode);

  const rawText = await generateText(prompt);

  const advice = parseCoachAdvice(rawText);

  return advice;
}

/**
 * Turn the structured context into a natural‑language prompt.
 */
function buildCoachPrompt(
  userId: string,
  context: CoachContext,
  mode: 'daily' | 'question'
): string {
  const parts: string[] = [];

  parts.push(
    `You are WellSync, a friendly and practical digital health coach.` +
      ` You talk to one user identified as ID ${userId}.` +
      ` Use simple language and give short, concrete suggestions.` +
      ` Focus strictly on fitness, movement, general well-being, and basic nutrition,` +
      ` and never give medical diagnoses or treatments.`
  );

  // Basic profile
  const nameOrUser = context.name ?? 'the user';
  parts.push(`User profile:`);
  parts.push(`- Name: ${nameOrUser}`);
  if (typeof context.age === 'number') {
    parts.push(`- Age: ${context.age}`);
  }
  if (context.activityLevel) {
    parts.push(`- Activity level: ${context.activityLevel}`);
  }
  if (typeof context.stepGoalPerDay === 'number') {
    parts.push(`- Daily step goal: ${context.stepGoalPerDay}`);
  }

  // Current stats
  parts.push(`Current stats (today):`);
  if (typeof context.stepsToday === 'number') {
    parts.push(`- Steps today so far: ${context.stepsToday}`);
  }
  if (typeof context.avgHeartRateToday === 'number') {
    parts.push(`- Average heart rate today: ${context.avgHeartRateToday} bpm`);
  }
  if (typeof context.maxHeartRateToday === 'number') {
    parts.push(`- Max heart rate today: ${context.maxHeartRateToday} bpm`);
  }

  // History / trends
  parts.push(`Recent history:`);
  if (typeof context.avgStepsLast7Days === 'number') {
    parts.push(
      `- Average steps over the last 7 days: ${context.avgStepsLast7Days}`
    );
  }
  if (typeof context.avgHeartRateLast7Days === 'number') {
    parts.push(
      `- Average heart rate over the last 7 days: ${context.avgHeartRateLast7Days} bpm`
    );
  }

  // Optional subjective info
  if (context.mood || typeof context.sleepHours === 'number' || context.notes) {
    parts.push(`User-reported info:`);
    if (context.mood) {
      parts.push(`- Mood: ${context.mood}`);
    }
    if (typeof context.sleepHours === 'number') {
      parts.push(`- Sleep last night (hours): ${context.sleepHours}`);
    }
    if (context.notes) {
      parts.push(`- Extra notes: ${context.notes}`);
    }
  }

  // QUESTION MODE
  if (mode === 'question' && context.question) {
    parts.push(`The user has asked a specific question: "${context.question}".`);
    parts.push(
      `Answer this question directly in 2–3 concise sentences, using the provided stats when relevant.` +
        ` If the question is about today's steps and stepsToday is known, clearly state the exact number (for example: "You have 6,600 steps so far today").` +
        ` Stay within health, fitness, general well-being, and basic nutrition.` +
        ` If the question is outside these topics, politely refuse and remind the user that you are a health and fitness coach.`
    );
    return parts.join('\n');
  }

  // DAILY MODE (existing behavior)
  parts.push(
    `Based on this profile, today's stats, and recent history:` +
      ` 1) Start with a 1–2 sentence summary of how the user's activity today compares to their usual pattern.` +
      ` 2) Then list 3 concrete, realistic action steps for today (numbered list) focused mainly on steps and movement.` +
      ` 3) If today's heart rate looks higher than their recent average, gently suggest slowing down or resting and encourage them to consult a professional for any worrying symptoms, without giving diagnoses.`
  );

  return parts.join('\n');
}

/**
 * Very simple parser: split the model's text into a summary
 * and a list of action steps by looking for numbered lines.
 */
function parseCoachAdvice(rawText: string): CoachAdvice {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const actionSteps: string[] = [];
  const summaryLines: string[] = [];

  for (const line of lines) {
    if (/^\d+[\).\s]/.test(line)) {
      actionSteps.push(line.replace(/^\d+[\).\s]/, '').trim());
    } else {
      summaryLines.push(line);
    }
  }

  const summary = summaryLines.join(' ');

  return {
    summary,
    actionSteps,
  };
}