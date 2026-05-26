import { supabaseAdmin } from '../db/index.js';

export interface CommunityActivity {
  id: string;
  creator_user_id: string;
  creator_name: string | null;     // creator full name (or null)
  is_friend_host: boolean;         // whether creator is a friend of viewer
  title: string;
  description: string | null;
  city: string;
  location_details: string | null;
  start_time_utc: string;
  end_time_utc: string;
  is_public: boolean;
  created_at: string;
  participants_count: number;
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

  // creator_name and is_friend_host are not strictly needed on create,
  // frontend currently overrides creatorName as "You" for created activities.
  return {
    ...(data as any),
    creator_name: null,
    is_friend_host: false,
    participants_count: 1, // creator is first participant
  } as CommunityActivity;
}

export interface ListActivitiesOptions {
  userId: string;                  // current user id
  city?: string | undefined;
  fromTimeUtc?: string | undefined; // ISO string
}

export async function listPublicActivities(
  options: ListActivitiesOptions
): Promise<CommunityActivity[]> {
  const { userId, city, fromTimeUtc } = options;

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
  const ids = activities.map((a) => a.id as string);

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

  // Collect creator ids for profiles and friends lookup
  const creatorIds = Array.from(
    new Set(activities.map((a) => a.creator_user_id as string))
  );

  // Load profiles for creators (full_name)
  const profilesById = new Map<string, { full_name: string | null }>();

  if (creatorIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds);

    if (profileError) {
      // Log but do not fail; we can still return activities with "Host"
      console.error('listPublicActivities profiles query error', profileError);
    } else {
      for (const row of profileRows ?? []) {
        const r = row as any;
        profilesById.set(r.id as string, {
          full_name: (r.full_name as string | null) ?? null,
        });
      }
    }
  }

  if (creatorIds.length === 0) {
    // No creators -> just map counts and neutral fields
    return activities.map((a) => {
      const participants_count = counts.get(a.id) ?? 0;
      const profile = profilesById.get(a.creator_user_id as string) ?? null;
      const creator_name =
        profile?.full_name?.trim() || 'Host';

      return {
        id: a.id,
        creator_user_id: a.creator_user_id,
        creator_name,
        is_friend_host: false,
        title: a.title,
        description: a.description,
        city: a.city,
        location_details: a.location_details,
        start_time_utc: a.start_time_utc,
        end_time_utc: a.end_time_utc,
        is_public: a.is_public,
        created_at: a.created_at,
        participants_count,
      } as CommunityActivity;
    });
  }

  // Query friends where status is 'accepted' and other side is one of creatorIds
  const { data: friendsData, error: friendsError } = await supabaseAdmin
    .from('friends')
    .select('user_id, friend_user_id, status')
    .eq('status', 'accepted')
    .or(
      `and(user_id.eq.${userId},friend_user_id.in.(${creatorIds.join(
        ','
      )})),and(friend_user_id.eq.${userId},user_id.in.(${creatorIds.join(',')}))`
    );

  if (friendsError) {
    throw friendsError;
  }

  const friendCreatorIds = new Set<string>();
  for (const row of friendsData ?? []) {
    const u = (row as any).user_id as string;
    const f = (row as any).friend_user_id as string;
    const other = u === userId ? f : u;
    friendCreatorIds.add(other);
  }

  const result: CommunityActivity[] = activities.map((a) => {
    const participants_count = counts.get(a.id) ?? 0;

    const creatorId = a.creator_user_id as string;
    const profile = profilesById.get(creatorId) ?? null;
    const creator_name =
      profile?.full_name?.trim() || 'Host';

    const is_friend_host = friendCreatorIds.has(creatorId);

    return {
      id: a.id,
      creator_user_id: creatorId,
      creator_name,
      is_friend_host,
      title: a.title,
      description: a.description,
      city: a.city,
      location_details: a.location_details,
      start_time_utc: a.start_time_utc,
      end_time_utc: a.end_time_utc,
      is_public: a.is_public,
      created_at: a.created_at,
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

  // Collect IDs for counts
  const ids: string[] = [];

  for (const row of rows) {
    if (row.activity) {
      activities.push({
        id: row.activity.id,
        creator_user_id: row.activity.creator_user_id,
        creator_name: null,         // frontend sets "You" for mine
        is_friend_host: false,      // not used in "Your activities" yet
        title: row.activity.title,
        description: row.activity.description,
        city: row.activity.city,
        location_details: row.activity.location_details,
        start_time_utc: row.activity.start_time_utc,
        end_time_utc: row.activity.end_time_utc,
        is_public: row.activity.is_public,
        created_at: row.activity.created_at,
        participants_count: 0,      // temporary, will fill below
      });
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

// UPDATED: ensure creator rejoins as 'creator', others as 'member'
export async function joinActivity(
  userId: string,
  activityId: string
): Promise<void> {
  // Load activity to see who the creator is
  const { data: activity, error: activityError } = await supabaseAdmin
    .from('community_activities')
    .select('creator_user_id')
    .eq('id', activityId)
    .single();

  if (activityError) {
    throw activityError;
  }

  const role =
    activity && activity.creator_user_id === userId ? 'creator' : 'member';

  const { error } = await supabaseAdmin
    .from('community_activity_members')
    .insert({
      activity_id: activityId,
      user_id: userId,
      role,
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