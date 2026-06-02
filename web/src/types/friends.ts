// src/types/friends.ts
export interface FriendUser {
  id: string;
  username: string | null;
  full_name: string | null;
}

export interface FriendsOverviewResponse {
  friends: FriendUser[];
  incoming_requests: FriendUser[];
  outgoing_requests: FriendUser[];
}

// NEW: activity invitations for the current user
export interface ActivityInvitation {
  id: number;
  activity_id: string;
  activity_title: string;
  inviter_user_id: string;
  inviter_name: string | null;
  city: string | null;
  scheduled_for: string; // preformatted label from backend or client
}