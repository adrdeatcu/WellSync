// src/services/coachDataService.ts
import { CoachContext } from './coachService.js';
import { supabaseAdmin } from '../db/index.js';

// Helper to format a Date as YYYY-MM-DD
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
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

  // 2. Load today's stats from public.daily_stats
  const today = new Date();
  const todayStr = toDateString(today);

  const { data: todayStats, error: todayError } = await supabaseAdmin
    .from('daily_stats')
    .select('total_steps, avg_heart_rate_bpm, max_heart_rate_bpm')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .maybeSingle();

  if (todayError) {
    console.error('Error loading today stats for coach context:', todayError);
  }

  // 3. Load last 7 days stats (including today) from public.daily_stats
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

  const context: CoachContext = {
    // Profile
    name: profile?.full_name ?? undefined,
    age: profile?.age ?? undefined,
    activityLevel: profile?.activity_level ?? undefined,
    stepGoalPerDay: profile?.step_goal_per_day ?? undefined,

    // Today stats
    stepsToday: todayStats?.total_steps ?? undefined,
    avgHeartRateToday: todayStats?.avg_heart_rate_bpm ?? undefined,
    maxHeartRateToday: todayStats?.max_heart_rate_bpm ?? undefined,

    // History
    avgStepsLast7Days,
    avgHeartRateLast7Days,

    // mood, sleepHours, notes will be added in the route from the request body
  };

  return context;
}