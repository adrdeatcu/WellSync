// src/services/coachDataService.ts
import { CoachContext } from './coachService.js';
import { supabaseAdmin } from '../db/index.js';

// Helper to format a Date as YYYY-MM-DD
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Helper to get start and end of today in ISO (for timestamptz filter)
function getTodayBounds(): { startIso: string; endIso: string } {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export async function loadCoachContext(userId: string): Promise<CoachContext> {
  // 1. Load profile from public.profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('full_name, age, activity_level, step_goal_per_day')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Error loading profile for coach context:', profileError);
  }

  // 2. Load last 7 days stats from public.daily_stats (for history)
  const today = new Date();
  const todayStr = toDateString(today);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // last 7 days = today + previous 6
  const sevenDaysAgoStr = toDateString(sevenDaysAgo);

  const { data: last7, error: last7Error } = await supabaseAdmin
    .from('daily_stats')
    .select('total_steps, avg_heart_rate_bpm, date')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgoStr)
    .lte('date', todayStr);

  if (last7Error) {
    console.error('Error loading last 7 days stats for coach context:', last7Error);
  }

  let avgStepsLast7Days: number | undefined;
  let avgHeartRateLast7Days: number | undefined;

  if (last7 && last7.length > 0) {
    const totalStepsSum = last7
      .map((row) => row.total_steps ?? 0)
      .reduce((sum, val) => sum + val, 0);

    const hrValues = last7
      .map((row) => row.avg_heart_rate_bpm)
      .filter((v) => typeof v === 'number') as number[];

    avgStepsLast7Days = totalStepsSum / last7.length;

    if (hrValues.length > 0) {
      const hrSum = hrValues.reduce((sum, val) => sum + val, 0);
      avgHeartRateLast7Days = hrSum / hrValues.length;
    }
  }

  // 3. Load latest measurements_minute for today (live stats)
  const { startIso, endIso } = getTodayBounds();

  const { data: latestMeasurement, error: measError } = await supabaseAdmin
    .from('measurements_minute')
    .select(
      'steps_total_today, avg_heart_rate_bpm, max_heart_rate_bpm, timestamp_minute_utc'
    )
    .eq('user_id', userId)
    .gte('timestamp_minute_utc', startIso)
    .lte('timestamp_minute_utc', endIso)
    .order('timestamp_minute_utc', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (measError) {
    console.error(
      'Error loading latest measurement for coach context:',
      measError
    );
  }

  const context: CoachContext = {
    // Profile
    name: profile?.full_name ?? undefined,
    age: profile?.age ?? undefined,
    activityLevel: profile?.activity_level ?? undefined,
    stepGoalPerDay: profile?.step_goal_per_day ?? undefined,

    // Today stats (live from measurements_minute)
    stepsToday: latestMeasurement?.steps_total_today ?? undefined,
    avgHeartRateToday: latestMeasurement?.avg_heart_rate_bpm ?? undefined,
    maxHeartRateToday: latestMeasurement?.max_heart_rate_bpm ?? undefined,

    // History (from daily_stats)
    avgStepsLast7Days,
    avgHeartRateLast7Days,

    // mood, sleepHours, notes will be added in the route from the request body
  };

  return context;
}