// src/services/profileService.ts
import { supabaseAdmin } from '../db/index.js';

export interface Profile {
  username: string | null;
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  step_goal_per_day: number;
  high_hr_threshold: number | null;
  low_spo2_threshold: number | null;
  poor_air_quality_threshold: number | null;
  // NEW: emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface UpdateProfileInput {
  username?: string | null;
  full_name?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  step_goal_per_day?: number;
  high_hr_threshold?: number | null;
  low_spo2_threshold?: number | null;
  poor_air_quality_threshold?: number | null;
  // NEW: emergency contact
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export async function getProfileForUser(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      `
      username,
      full_name,
      age,
      height_cm,
      weight_kg,
      activity_level,
      step_goal_per_day,
      high_hr_threshold,
      low_spo2_threshold,
      poor_air_quality_threshold,
      emergency_contact_name,
      emergency_contact_phone
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
    username: data.username ?? null,
    full_name: data.full_name ?? null,
    age: data.age ?? null,
    height_cm: data.height_cm ?? null,
    weight_kg: data.weight_kg ?? null,
    activity_level: data.activity_level ?? null,
    step_goal_per_day: data.step_goal_per_day,
    high_hr_threshold: data.high_hr_threshold ?? null,
    low_spo2_threshold: data.low_spo2_threshold ?? null,
    poor_air_quality_threshold: data.poor_air_quality_threshold ?? null,
    emergency_contact_name: data.emergency_contact_name ?? null,
    emergency_contact_phone: data.emergency_contact_phone ?? null,
  };
}

export async function updateProfileForUser(
  userId: string,
  input: UpdateProfileInput
): Promise<Profile> {
  const update: Record<string, unknown> = {};

  if ('username' in input) {
    update.username = input.username;
  }
  if ('full_name' in input) {
    update.full_name = input.full_name;
  }
  if ('age' in input) {
    update.age = input.age;
  }
  if ('height_cm' in input) {
    update.height_cm = input.height_cm;
  }
  if ('weight_kg' in input) {
    update.weight_kg = input.weight_kg;
  }
  if ('activity_level' in input) {
    update.activity_level = input.activity_level;
  }
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
  // NEW: emergency contact
  if ('emergency_contact_name' in input) {
    update.emergency_contact_name = input.emergency_contact_name;
  }
  if ('emergency_contact_phone' in input) {
    update.emergency_contact_phone = input.emergency_contact_phone;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(
      `
      username,
      full_name,
      age,
      height_cm,
      weight_kg,
      activity_level,
      step_goal_per_day,
      high_hr_threshold,
      low_spo2_threshold,
      poor_air_quality_threshold,
      emergency_contact_name,
      emergency_contact_phone
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    username: data.username ?? null,
    full_name: data.full_name ?? null,
    age: data.age ?? null,
    height_cm: data.height_cm ?? null,
    weight_kg: data.weight_kg ?? null,
    activity_level: data.activity_level ?? null,
    step_goal_per_day: data.step_goal_per_day,
    high_hr_threshold: data.high_hr_threshold ?? null,
    low_spo2_threshold: data.low_spo2_threshold ?? null,
    poor_air_quality_threshold: data.poor_air_quality_threshold ?? null,
    emergency_contact_name: data.emergency_contact_name ?? null,
    emergency_contact_phone: data.emergency_contact_phone ?? null,
  };
}