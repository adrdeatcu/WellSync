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
  participants_count: number; // NEW
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

  return {
    ...(data as any),
    participants_count: 1, // creator is first participant
  } as CommunityActivity;
}

export interface ListActivitiesOptions {
  city?: string | undefined;
  fromTimeUtc?: string | undefined; // ISO string
}

export async function listPublicActivities(
  options: ListActivitiesOptions
): Promise<CommunityActivity[]> {
  const { city, fromTimeUtc } = options;

  // Fetch all public activities matching filters
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

  const { data, error } = await query.order('start_time_utc', {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  const activities = (data ?? []) as any[];

  if (activities.length === 0) {
    return [];
  }

  // Compute participants_count per activity
  const ids = activities.map((a) => a.id);

  const { data: membersData, error: membersError } = await supabaseAdmin
    .from('community_activity_members')
    .select('activity_id')
    .in('activity_id', ids);

  if (membersError) {
    throw membersError;
  }

  const counts = new Map<string, number>();
  for (const row of membersData ?? []) {
    const actId = (row as any).activity_id as string;
    counts.set(actId, (counts.get(actId) ?? 0) + 1);
  }

  const result: CommunityActivity[] = activities.map((a) => {
    const participants_count = counts.get(a.id) ?? 0;
    return {
      ...a,
      participants_count,
    } as CommunityActivity;
  });

  return result;
}

// helper type for the join result
type MemberRow = {
  activity: {
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
  } | null;
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

  // We will reuse the same aggregated counts logic by collecting IDs
  const ids: string[] = [];

  for (const row of rows) {
    if (row.activity) {
      activities.push({
        ...row.activity,
        participants_count: 0, // temporary, will fill below
      } as CommunityActivity);
      ids.push(row.activity.id);
    }
  }

  if (ids.length === 0) {
    return [];
  }

  const { data: membersData, error: membersError } = await supabaseAdmin
    .from('community_activity_members')
    .select('activity_id')
    .in('activity_id', ids);

  if (membersError) {
    throw membersError;
  }

  const counts = new Map<string, number>();
  for (const row of membersData ?? []) {
    const actId = (row as any).activity_id as string;
    counts.set(actId, (counts.get(actId) ?? 0) + 1);
  }

  const withCounts: CommunityActivity[] = activities.map((a) => ({
    ...a,
    participants_count: counts.get(a.id) ?? 0,
  }));

  return withCounts;
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

  // Ignore unique violation (already joined)
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