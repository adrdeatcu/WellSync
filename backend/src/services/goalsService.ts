import { supabaseAdmin } from '../db/index.js';

export interface Goals {
  step_goal_per_day: number;
  high_hr_threshold: number | null;
  low_spo2_threshold: number | null;
  poor_air_quality_threshold: number | null;
}

export async function getGoalsForUser(userId: string): Promise<Goals | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      `
      step_goal_per_day,
      high_hr_threshold,
      low_spo2_threshold,
      poor_air_quality_threshold
      `
    )
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // no row found
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    step_goal_per_day: data.step_goal_per_day,
    high_hr_threshold: data.high_hr_threshold ?? null,
    low_spo2_threshold: data.low_spo2_threshold ?? null,
    poor_air_quality_threshold: data.poor_air_quality_threshold ?? null
  };
}

export interface UpdateGoalsInput {
  step_goal_per_day?: number;
  high_hr_threshold?: number | null;
  low_spo2_threshold?: number | null;
  poor_air_quality_threshold?: number | null;
}

export async function updateGoalsForUser(
  userId: string,
  input: UpdateGoalsInput
): Promise<Goals> {
  const update: Record<string, unknown> = {};

  if (typeof input.step_goal_per_day === 'number') {
    update.step_goal_per_day = input.step_goal_per_day;
  }
  if ('high_hr_threshold' in input) {
    update.high_hr_threshold = input.high_hr_threshold;
  }
  if ('low_spo2_threshold' in input) {
    update.low_spo2_threshold = input.low_spo2_threshold;
  }
  if ('poor_air_quality_threshold' in input) {
    update.poor_air_quality_threshold = input.poor_air_quality_threshold;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(
      `
      step_goal_per_day,
      high_hr_threshold,
      low_spo2_threshold,
      poor_air_quality_threshold
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    step_goal_per_day: data.step_goal_per_day,
    high_hr_threshold: data.high_hr_threshold ?? null,
    low_spo2_threshold: data.low_spo2_threshold ?? null,
    poor_air_quality_threshold: data.poor_air_quality_threshold ?? null
  };
}