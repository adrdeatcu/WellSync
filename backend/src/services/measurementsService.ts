import { supabaseAdmin } from '../db/index.js';
import type { IncomingPerMinuteMeasurement } from '../types/measurements.js';

export async function upsertMeasurementsForUser(
  userId: string,
  measurements: IncomingPerMinuteMeasurement[]
) {
  if (measurements.length === 0) {
    return;
  }

  const rows = measurements.map((m) => ({
    user_id: userId,
    timestamp_minute_utc: m.timestamp_minute_utc,
    steps_total_today: m.steps_total_today,
    avg_heart_rate_bpm: m.avg_heart_rate_bpm ?? null,
    min_heart_rate_bpm: m.min_heart_rate_bpm ?? null,
    max_heart_rate_bpm: m.max_heart_rate_bpm ?? null,
    avg_spo2: m.avg_spo2 ?? null,
    avg_air_quality_index: m.avg_air_quality_index ?? null,
    avg_temperature_c: m.avg_temperature_c ?? null,
    avg_humidity_percent: m.avg_humidity_percent ?? null,
    avg_pressure_hpa: m.avg_pressure_hpa ?? null
  }));

  const { error } = await supabaseAdmin
    .from('measurements_minute')
    .upsert(rows, {
      onConflict: 'user_id,timestamp_minute_utc'
    });

  if (error) {
    throw error;
  }
}