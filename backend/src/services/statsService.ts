import { supabaseAdmin } from '../db/index.js';

export interface TodayStats {
  total_steps: number;
  avg_heart_rate_bpm: number | null;
  min_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
  avg_air_quality_index: number | null;
  avg_temperature_c: number | null;
  avg_humidity_percent: number | null;
  avg_pressure_hpa: number | null;
}

export async function getTodayStatsForUser(userId: string): Promise<TodayStats | null> {
  // For now, use UTC date boundaries. Later we can adjust for user timezone if needed.
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

  const { data, error } = await supabaseAdmin
    .from('measurements_minute')
    .select(
      `
      steps_total_today,
      avg_heart_rate_bpm,
      min_heart_rate_bpm,
      max_heart_rate_bpm,
      avg_air_quality_index,
      avg_temperature_c,
      avg_humidity_percent,
      avg_pressure_hpa,
      timestamp_minute_utc
      `
    )
    .eq('user_id', userId)
    .gte('timestamp_minute_utc', startOfDay.toISOString())
    .lt('timestamp_minute_utc', endOfDay.toISOString());

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  let maxSteps = 0;
  let sumHr = 0;
  let countHr = 0;
  let minHr: number | null = null;
  let maxHr: number | null = null;

  let sumAqi = 0;
  let countAqi = 0;

  let sumTemp = 0;
  let countTemp = 0;

  let sumHum = 0;
  let countHum = 0;

  let sumPress = 0;
  let countPress = 0;

  for (const row of data as any[]) {
    // steps
    if (typeof row.steps_total_today === 'number') {
      if (row.steps_total_today > maxSteps) {
        maxSteps = row.steps_total_today;
      }
    }

    // heart rate averages
    if (typeof row.avg_heart_rate_bpm === 'number') {
      sumHr += row.avg_heart_rate_bpm;
      countHr++;
    }

    if (typeof row.min_heart_rate_bpm === 'number') {
      if (minHr === null || row.min_heart_rate_bpm < minHr) {
        minHr = row.min_heart_rate_bpm;
      }
    }

    if (typeof row.max_heart_rate_bpm === 'number') {
      if (maxHr === null || row.max_heart_rate_bpm > maxHr) {
        maxHr = row.max_heart_rate_bpm;
      }
    }

    // air quality
    if (typeof row.avg_air_quality_index === 'number') {
      sumAqi += row.avg_air_quality_index;
      countAqi++;
    }

    // temperature
    if (typeof row.avg_temperature_c === 'number') {
      sumTemp += row.avg_temperature_c;
      countTemp++;
    }

    // humidity
    if (typeof row.avg_humidity_percent === 'number') {
      sumHum += row.avg_humidity_percent;
      countHum++;
    }

    // pressure
    if (typeof row.avg_pressure_hpa === 'number') {
      sumPress += row.avg_pressure_hpa;
      countPress++;
    }
  }

  return {
    total_steps: maxSteps,
    avg_heart_rate_bpm: countHr > 0 ? sumHr / countHr : null,
    min_heart_rate_bpm: minHr,
    max_heart_rate_bpm: maxHr,
    avg_air_quality_index: countAqi > 0 ? sumAqi / countAqi : null,
    avg_temperature_c: countTemp > 0 ? sumTemp / countTemp : null,
    avg_humidity_percent: countHum > 0 ? sumHum / countHum : null,
    avg_pressure_hpa: countPress > 0 ? sumPress / countPress : null
  };
}