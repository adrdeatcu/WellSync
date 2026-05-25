import { supabaseAdmin } from '../db/index.js';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendRecord {
  id: number;
  user_id: string;
  friend_user_id: string;
  status: FriendStatus;
  created_at: string;
}

export interface UserSummary {
  id: string;
  username: string | null;
  full_name: string | null;
}

export async function searchUsersByNameOrUsername(
  currentUserId: string,
  query: string,
  limit = 10
): Promise<UserSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .neq('id', currentUserId)
    .or(
      [
        `username.ilike.%${trimmed}%`,
        `full_name.ilike.%${trimmed}%`,
      ].join(',')
    )
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    username: row.username ?? null,
    full_name: row.full_name ?? null,
  }));
}

export interface FriendsOverview {
  friends: UserSummary[];
  incoming_requests: UserSummary[];
  outgoing_requests: UserSummary[];
}

export async function getFriendsOverview(
  userId: string
): Promise<FriendsOverview> {
  // Load all friend rows involving this user
  const { data, error } = await supabaseAdmin
    .from('friends')
    .select('id, user_id, friend_user_id, status, created_at')
    .or(`user_id.eq.${userId},friend_user_id.eq.${userId}`);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as FriendRecord[];

  const friendIds = new Set<string>();
  const incomingIds = new Set<string>();
  const outgoingIds = new Set<string>();

  for (const row of rows) {
    const otherId = row.user_id === userId ? row.friend_user_id : row.user_id;

    if (row.status === 'accepted') {
      friendIds.add(otherId);
    } else if (row.status === 'pending') {
      if (row.user_id === userId) {
        outgoingIds.add(otherId);
      } else {
        incomingIds.add(otherId);
      }
    }
  }

  const allIds = new Set<string>([
    ...friendIds,
    ...incomingIds,
    ...outgoingIds,
  ]);

  if (allIds.size === 0) {
    return { friends: [], incoming_requests: [], outgoing_requests: [] };
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .in('id', Array.from(allIds));

  if (profilesError) {
    throw profilesError;
  }

  const byId = new Map<string, UserSummary>();
  for (const row of profiles ?? []) {
    byId.set(row.id, {
      id: row.id,
      username: row.username ?? null,
      full_name: row.full_name ?? null,
    });
  }

  const toList = (ids: Set<string>): UserSummary[] =>
    Array.from(ids)
      .map((id) => byId.get(id))
      .filter((x): x is UserSummary => !!x);

  return {
    friends: toList(friendIds),
    incoming_requests: toList(incomingIds),
    outgoing_requests: toList(outgoingIds),
  };
}

export async function sendFriendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot add yourself as a friend');
  }

  const [a, b] =
    currentUserId < targetUserId
      ? [currentUserId, targetUserId]
      : [targetUserId, currentUserId];

  const { data, error } = await supabaseAdmin
    .from('friends')
    .upsert(
      [
        {
          user_id: a,
          friend_user_id: b,
          status: 'pending' as FriendStatus,
        },
      ],
      { onConflict: 'user_id,friend_user_id' }
    )
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create friend request');
  }
}

export async function acceptFriendRequest(
  currentUserId: string,
  otherUserId: string
): Promise<void> {
  const [a, b] =
    currentUserId < otherUserId
      ? [currentUserId, otherUserId]
      : [otherUserId, currentUserId];

  const { error } = await supabaseAdmin
    .from('friends')
    .update({ status: 'accepted' })
    .eq('user_id', a)
    .eq('friend_user_id', b)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
}