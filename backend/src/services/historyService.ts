import { supabaseAdmin } from '../db/index.js';

export interface StepsHistoryItem {
  date: string;        // ISO date string, e.g. "2026-05-11"
  total_steps: number; // may be 0 if null in DB
}

export interface HeartRateHistoryItem {
  date: string;                 // ISO date string
  avg_heart_rate_bpm: number | null;
  min_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
}

export async function getStepsHistoryForUser(
  userId: string,
  days: number
): Promise<StepsHistoryItem[]> {
  const now = new Date();
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - (days - 1));

  const { data, error } = await supabaseAdmin
    .from('daily_stats')
    .select('date, total_steps')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().slice(0, 10))
    .lte('date', endDate.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return (data as any[]).map((row) => ({
    date: row.date, // Supabase returns date as string "YYYY-MM-DD"
    total_steps: row.total_steps ?? 0,
  }));
}

export async function getHeartRateHistoryForUser(
  userId: string,
  days: number
): Promise<HeartRateHistoryItem[]> {
  const now = new Date();
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - (days - 1));

  const { data, error } = await supabaseAdmin
    .from('daily_stats')
    .select(
      `
      date,
      avg_heart_rate_bpm,
      min_heart_rate_bpm,
      max_heart_rate_bpm
      `
    )
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().slice(0, 10))
    .lte('date', endDate.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return (data as any[]).map((row) => ({
    date: row.date,
    avg_heart_rate_bpm:
      typeof row.avg_heart_rate_bpm === 'number'
        ? row.avg_heart_rate_bpm
        : null,
    min_heart_rate_bpm:
      typeof row.min_heart_rate_bpm === 'number'
        ? row.min_heart_rate_bpm
        : null,
    max_heart_rate_bpm:
      typeof row.max_heart_rate_bpm === 'number'
        ? row.max_heart_rate_bpm
        : null,
  }));
}