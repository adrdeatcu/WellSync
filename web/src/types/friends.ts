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