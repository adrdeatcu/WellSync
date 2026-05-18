import 'dotenv/config';
import { supabaseAdmin } from '../db/index.js';

interface MinuteRow {
  user_id: string;
  timestamp_minute_utc: string;
  steps_total_today: number | null;
  avg_heart_rate_bpm: number | null;
  min_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
  avg_spo2: number | null;
  avg_air_quality_index: number | null;
  avg_temperature_c: number | null;
  avg_humidity_percent: number | null;
  avg_pressure_hpa: number | null;
}

// Helper: truncate timestamptz to date (YYYY-MM-DD, UTC)
function toUtcDateString(ts: string): string {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function main() {
  console.log('Starting daily aggregation job...');

  const now = new Date();
  // Cutoff: keep last 3 days, aggregate anything strictly before that
  const cutoffDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3)
  );
  const cutoffIsoDate = cutoffDate.toISOString().slice(0, 10);
  console.log('Cutoff date (exclusive):', cutoffIsoDate);

  // Step 1: fetch all measurements older than cutoff date
  const { data, error } = await supabaseAdmin
    .from('measurements_minute')
    .select(
      `
      user_id,
      timestamp_minute_utc,
      steps_total_today,
      avg_heart_rate_bpm,
      min_heart_rate_bpm,
      max_heart_rate_bpm,
      avg_spo2,
      avg_air_quality_index,
      avg_temperature_c,
      avg_humidity_percent,
      avg_pressure_hpa
      `
    )
    .lt('timestamp_minute_utc', cutoffDate.toISOString());

  if (error) {
    console.error('Error fetching old measurements_minute:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No old per-minute measurements to aggregate. Done.');
    return;
  }

  const rows = data as MinuteRow[];
  console.log(`Fetched ${rows.length} old per-minute rows.`);

  // Step 2: group by (user_id, date)
  const groups = new Map<string, MinuteRow[]>();
  for (const row of rows) {
    const dateStr = toUtcDateString(row.timestamp_minute_utc);
    const key = `${row.user_id}::${dateStr}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  console.log(`Found ${groups.size} (user_id, date) groups to aggregate.`);

  // Step 3: build daily_stats upsert rows
  type DailyRow = {
    user_id: string;
    date: string;
    total_steps: number | null;
    avg_heart_rate_bpm: number | null;
    min_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
    avg_spo2: number | null;
    avg_air_quality_index: number | null;
    avg_temperature_c: number | null;
    avg_humidity_percent: number | null;
    avg_pressure_hpa: number | null;
  };

  const dailyRows: DailyRow[] = [];

  for (const [key, groupRows] of groups.entries()) {
    const [user_idRaw, dateRaw] = key.split('::');

    if (!user_idRaw || !dateRaw) {
      // Skip malformed keys just in case
      continue;
    }

    const user_id = user_idRaw as string;
    const date = dateRaw as string;

    let maxSteps = 0;

    let sumHr = 0;
    let countHr = 0;
    let minHr: number | null = null;
    let maxHr: number | null = null;

    let sumSpO2 = 0;
    let countSpO2 = 0;

    let sumAqi = 0;
    let countAqi = 0;

    let sumTemp = 0;
    let countTemp = 0;

    let sumHum = 0;
    let countHum = 0;

    let sumPress = 0;
    let countPress = 0;

    for (const row of groupRows) {
      if (typeof row.steps_total_today === 'number') {
        if (row.steps_total_today > maxSteps) {
          maxSteps = row.steps_total_today;
        }
      }

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

      if (typeof row.avg_spo2 === 'number') {
        sumSpO2 += row.avg_spo2;
        countSpO2++;
      }

      if (typeof row.avg_air_quality_index === 'number') {
        sumAqi += row.avg_air_quality_index;
        countAqi++;
      }

      if (typeof row.avg_temperature_c === 'number') {
        sumTemp += row.avg_temperature_c;
        countTemp++;
      }

      if (typeof row.avg_humidity_percent === 'number') {
        sumHum += row.avg_humidity_percent;
        countHum++;
      }

      if (typeof row.avg_pressure_hpa === 'number') {
        sumPress += row.avg_pressure_hpa;
        countPress++;
      }
    }

    const daily: DailyRow = {
      user_id,
      date,
      total_steps: maxSteps > 0 ? maxSteps : null,
      avg_heart_rate_bpm: countHr > 0 ? sumHr / countHr : null,
      min_heart_rate_bpm: minHr,
      max_heart_rate_bpm: maxHr,
      avg_spo2: countSpO2 > 0 ? sumSpO2 / countSpO2 : null,
      avg_air_quality_index: countAqi > 0 ? sumAqi / countAqi : null,
      avg_temperature_c: countTemp > 0 ? sumTemp / countTemp : null,
      avg_humidity_percent: countHum > 0 ? sumHum / countHum : null,
      avg_pressure_hpa: countPress > 0 ? sumPress / countPress : null,
    };

    dailyRows.push(daily);
  }

  console.log(`Prepared ${dailyRows.length} daily_stats rows to upsert.`);

  // Step 4: upsert into daily_stats
  const { error: upsertError } = await supabaseAdmin
    .from('daily_stats')
    .upsert(dailyRows, {
      onConflict: 'user_id,date',
    });

  if (upsertError) {
    console.error('Error upserting into daily_stats:', upsertError);
    process.exit(1);
  }

  console.log('Upsert into daily_stats completed.');

  // Step 5: delete old measurements_minute rows
  const { error: deleteError } = await supabaseAdmin
    .from('measurements_minute')
    .delete()
    .lt('timestamp_minute_utc', cutoffDate.toISOString());

  if (deleteError) {
    console.error('Error deleting old measurements_minute rows:', deleteError);
    process.exit(1);
  }

  console.log('Deleted old per-minute measurements before', cutoffIsoDate);
  console.log('Daily aggregation job finished.');
}

main().catch((err) => {
  console.error('Unexpected error in aggregation script:', err);
  process.exit(1);
});