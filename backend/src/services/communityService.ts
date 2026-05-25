import { supabaseAdmin } from '../db/index.js';

export interface CommunityActivity {
  id: string;
  creator_user_id: string;
  title: string;
  description: string | null;
  city: string;
  location_details: string | null;
  start_time_utc: string;
  end_time_utc: string;
  is_public: boolean;
  created_at: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string | null;
  city: string;
  location_details?: string | null;
  start_time_utc: string; // ISO string
  end_time_utc: string;   // ISO string
  is_public?: boolean;
}

export async function createActivity(
  creatorUserId: string,
  input: CreateActivityInput
): Promise<CommunityActivity> {
  const payload = {
    creator_user_id: creatorUserId,
    title: input.title,
    description: input.description ?? null,
    city: input.city,
    location_details: input.location_details ?? null,
    start_time_utc: input.start_time_utc,
    end_time_utc: input.end_time_utc,
    is_public: input.is_public ?? true,
  };

  const { data, error } = await supabaseAdmin
    .from('community_activities')
    .insert(payload)
    .select(
      `
      id,
      creator_user_id,
      title,
      description,
      city,
      location_details,
      start_time_utc,
      end_time_utc,
      is_public,
      created_at
      `
    )
    .single();

  if (error) {
    throw error;
  }

  const { error: memberError } = await supabaseAdmin
    .from('community_activity_members')
    .insert({
      activity_id: data.id,
      user_id: creatorUserId,
      role: 'creator',
    });

  if (memberError) {
    throw memberError;
  }

  return data as unknown as CommunityActivity;
}

export interface ListActivitiesOptions {
  city?: string | undefined;
  fromTimeUtc?: string | undefined; // ISO string
}

export async function listPublicActivities(
  options: ListActivitiesOptions
): Promise<CommunityActivity[]> {
  const { city, fromTimeUtc } = options;
  let query = supabaseAdmin
    .from('community_activities')
    .select(
      `
      id,
      creator_user_id,
      title,
      description,
      city,
      location_details,
      start_time_utc,
      end_time_utc,
      is_public,
      created_at
      `
    )
    .eq('is_public', true);

  if (city) {
    query = query.eq('city', city);
  }

  const nowIso = new Date().toISOString();
  query = query.gte('end_time_utc', fromTimeUtc ?? nowIso);

  const { data, error } = await query.order('start_time_utc', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as CommunityActivity[];
}

// helper type for the join result
type MemberRow = {
  activity: CommunityActivity | null;
};

export async function listMyActivities(
  userId: string
): Promise<CommunityActivity[]> {
  const { data, error } = await supabaseAdmin
    .from('community_activity_members')
    .select(
      `
      activity:community_activities (
        id,
        creator_user_id,
        title,
        description,
        city,
        location_details,
        start_time_utc,
        end_time_utc,
        is_public,
        created_at
      )
      `
    )
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as MemberRow[];
  const activities: CommunityActivity[] = [];

  for (const row of rows) {
    if (row.activity) {
      activities.push(row.activity);
    }
  }

  return activities;
}

export async function joinActivity(
  userId: string,
  activityId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('community_activity_members')
    .insert({
      activity_id: activityId,
      user_id: userId,
      role: 'member',
    });

  if (error && (error as any).code !== '23505') {
    throw error;
  }
}

export async function leaveActivity(
  userId: string,
  activityId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('community_activity_members')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}