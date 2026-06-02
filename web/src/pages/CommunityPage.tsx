// src/pages/CommunityPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from './DashboardPage';
import CreateActivityWidget from '../components/CreateActivityWidget';
import ActivityModal from '../components/ActivityModal';
import ActivityChatModal from '../components/ActivityChatModal';
import ActivityInviteModal, {
  type InviteFriend,
} from '../components/ActivityInviteModal';
import MyActivitiesSection from '../components/MyActivitiesSection';
import PublicActivitiesSection from '../components/PublicActivitiesSection';
import { supabase } from '../supabaseClient';
import './CommunityPage.css';

const backendUrl =
  process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

export interface CommunityActivity {
  id: string;
  title: string;
  description: string;
  type: 'walk' | 'run' | 'steps' | 'challenge';
  creatorName: string;
  participantsCount: number;
  isFriendHost: boolean;
  scheduledFor: string;
  city?: string;
  locationDetails?: string;
  // whether the logged-in user is the creator of this activity
  isCreator?: boolean;
}

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  // "Your activities"
  const [myActivities, setMyActivities] = React.useState<CommunityActivity[]>(
    []
  );
  const [myActivitiesLoading, setMyActivitiesLoading] = React.useState(false);
  const [myActivitiesError, setMyActivitiesError] =
    React.useState<string | null>(null);

  // Public activities
  const [allPublicActivities, setAllPublicActivities] = React.useState<
    CommunityActivity[]
  >([]);
  const [publicActivities, setPublicActivities] = React.useState<
    CommunityActivity[]
  >([]);
  const [publicLoading, setPublicLoading] = React.useState(false);
  const [publicError, setPublicError] = React.useState<string | null>(null);

  // City filter (client-side, partial, case-insensitive)
  const [cityFilter, setCityFilter] = React.useState<string>('');

  // Friends-only filter
  const [friendsOnly, setFriendsOnly] = React.useState(false);

  // View / Join modal state (for public activities)
  const [selectedActivity, setSelectedActivity] =
    React.useState<CommunityActivity | null>(null);
  const [joinLoading, setJoinLoading] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // Confirm-leave modal state
  const [confirmLeaveForId, setConfirmLeaveForId] = React.useState<
    string | null
  >(null);

  // Activity chat modal state (for "Your activities")
  const [chatActivity, setChatActivity] =
    React.useState<CommunityActivity | null>(null);

  // Invite friends modal state
  const [inviteActivity, setInviteActivity] =
    React.useState<CommunityActivity | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [friendsForInvites, setFriendsForInvites] = React.useState<
    InviteFriend[]
  >([]);

  // per-activity invite state
  const [joinedFriendIds, setJoinedFriendIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [invitedFriendIds, setInvitedFriendIds] = React.useState<Set<string>>(
    () => new Set()
  );

  // Delete error state
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  function handleBackToDashboard() {
    navigate('/dashboard');
  }

  function handleOpenJoinModal(activityId: string) {
    const found = publicActivities.find((a) => a.id === activityId);

    if (!found) {
      console.warn('Activity not found in public list', activityId);
      return;
    }

    setSelectedActivity(found);
    setJoinError(null);
  }

  // Load all public activities once
  React.useEffect(() => {
    let cancelled = false;

    async function loadPublicActivities() {
      setPublicLoading(true);
      setPublicError(null);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Not logged in or cannot get session', sessionError);
        setPublicError('You must be logged in to view activities.');
        setPublicLoading(false);
        return;
      }

      const accessToken = sessionData.session.access_token;

      try {
        const res = await fetch(`${backendUrl}/api/activities`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const msg = errJson?.error ?? 'Failed to load activities.';
          console.error('Load public activities failed', msg);
          if (!cancelled) {
            setPublicError(msg);
          }
          return;
        }

        const json = await res.json();
        const activities = (json.activities ?? []) as {
          id: string;
          creator_user_id: string;
          creator_name: string | null;
          is_friend_host: boolean;
          title: string;
          description: string | null;
          city: string;
          location_details: string | null;
          start_time_utc: string;
          end_time_utc: string;
          is_public: boolean;
          created_at: string;
          participants_count: number;
        }[];

        if (cancelled) return;

        const mapped: CommunityActivity[] = activities.map((a) => {
          const whenLabel =
            'Starts • ' + new Date(a.start_time_utc).toLocaleString();

          return {
            id: a.id,
            title: a.title,
            description: a.description ?? 'No description provided.',
            // Placeholder type until DB supports this field
            type: 'walk',
            creatorName: a.creator_name ?? 'Host',
            participantsCount: a.participants_count ?? 0,
            isFriendHost: a.is_friend_host ?? false,
            scheduledFor: whenLabel,
            city: a.city,
            locationDetails: a.location_details ?? undefined,
            isCreator: false, // public list: we do not assume creator here
          };
        });

        setAllPublicActivities(mapped);
        // publicActivities now derived by effect (below)
      } catch (err) {
        console.error('Unexpected error loading public activities', err);
        if (!cancelled) {
          setPublicError('Unexpected error loading activities.');
        }
      } finally {
        if (!cancelled) {
          setPublicLoading(false);
        }
      }
    }

    loadPublicActivities();

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply city filter, friends-only filter, and hide activities already in "Your activities"
  React.useEffect(() => {
    const q = cityFilter.trim().toLowerCase();

    // ids of activities the user has created/joined
    const myIds = new Set(myActivities.map((a) => a.id));

    // start from all public, drop those already in myActivities
    let base = allPublicActivities.filter((activity) => !myIds.has(activity.id));

    // if friendsOnly is on, keep only activities hosted by friends
    if (friendsOnly) {
      base = base.filter((activity) => activity.isFriendHost);
    }

    // city filter
    if (q) {
      base = base.filter((activity) => {
        const cityName = (activity.city ?? '').toLowerCase();
        return cityName.includes(q);
      });
    }

    setPublicActivities(base);
  }, [cityFilter, friendsOnly, allPublicActivities, myActivities]);

  // Load "Your activities"
  React.useEffect(() => {
    let cancelled = false;

    async function loadMyActivities() {
      setMyActivitiesLoading(true);
      setMyActivitiesError(null);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Not logged in or cannot get session', sessionError);
        setMyActivitiesError('You must be logged in to view your activities.');
        setMyActivitiesLoading(false);
        return;
      }

      const accessToken = sessionData.session.access_token;

      try {
        const res = await fetch(`${backendUrl}/api/activities/mine`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const msg = errJson?.error ?? 'Failed to load your activities.';
          console.error('Load my activities failed', msg);
          if (!cancelled) {
            setMyActivitiesError(msg);
          }
          return;
        }

        const json = await res.json();
        const activities = (json.activities ?? []) as {
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
          participants_count: number;
          member_role: 'creator' | 'member';
        }[];

        if (cancelled) return;

        const mapped: CommunityActivity[] = activities.map((a) => {
          const whenLabel =
            'Starts • ' + new Date(a.start_time_utc).toLocaleString();

          const isCreator = a.member_role === 'creator';

          return {
            id: a.id,
            title: a.title,
            description: a.description ?? 'No description provided.',
            type: 'walk',
            // Only show "You" if the logged-in user is actually the creator
            creatorName: isCreator ? 'You' : 'Host',
            participantsCount: a.participants_count ?? 0,
            isFriendHost: false,
            scheduledFor: whenLabel,
            city: a.city,
            locationDetails: a.location_details ?? undefined,
            isCreator,
          };
        });

        setMyActivities(mapped);
      } catch (err) {
        console.error('Unexpected error loading my activities', err);
        if (!cancelled) {
          setMyActivitiesError('Unexpected error loading your activities.');
        }
      } finally {
        if (!cancelled) {
          setMyActivitiesLoading(false);
        }
      }
    }

    loadMyActivities();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load friends for invitations
  React.useEffect(() => {
    let cancelled = false;

    async function loadFriendsForInvites() {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Not logged in or cannot get session', sessionError);
        return;
      }

      const accessToken = sessionData.session.access_token;

      try {
        const res = await fetch(`${backendUrl}/api/friends`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const msg = errJson?.error ?? 'Failed to load friends.';
          console.error('Load friends for invites failed', msg);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        const friends = (json.friends ?? []) as {
          id: string;
          full_name: string | null;
          username: string | null;
        }[];

        const mapped: InviteFriend[] = friends.map((f) => ({
          id: f.id,
          name:
            (f.full_name && f.full_name.trim()) ||
            (f.username ? `@${f.username}` : 'Friend'),
        }));

        setFriendsForInvites(mapped);
      } catch (err) {
        console.error('Unexpected error loading friends for invites', err);
      }
    }

    loadFriendsForInvites();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateActivity(newActivity: {
    title: string;
    description: string;
    type: CommunityActivity['type'];
    city: string;
    locationDetails: string;
    startTime: string;
    endTime: string;
    isPublic: boolean;
  }) {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      alert('You must be logged in to create an activity.');
      return;
    }
    const accessToken = sessionData.session.access_token;

    const startLocal = new Date(newActivity.startTime);
    const endLocal = new Date(newActivity.endTime);

    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
      alert('Please provide valid start and end times.');
      return;
    }

    if (endLocal <= startLocal) {
      alert('End time must be after start time.');
      return;
    }

    const startUtcIso = startLocal.toISOString();
    const endUtcIso = endLocal.toISOString();

    const body = {
      title: newActivity.title.trim(),
      description: newActivity.description.trim() || null,
      city: newActivity.city.trim(),
      location_details: newActivity.locationDetails.trim() || null,
      start_time_utc: startUtcIso,
      end_time_utc: endUtcIso,
      is_public: newActivity.isPublic,
    };

    try {
      const res = await fetch(`${backendUrl}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to create activity.';
        console.error('Create activity failed', msg);
        alert(msg);
        return;
      }

      const json = await res.json();
      const created = json.activity as {
        id: string;
        title: string;
        description: string | null;
        city: string;
        location_details: string | null;
        start_time_utc: string;
        end_time_utc: string;
        is_public: boolean;
        created_at: string;
        participants_count?: number;
      };

      const whenLabel =
        newActivity.startTime && newActivity.endTime
          ? 'Planned • ' + newActivity.startTime.replace('T', ' ')
          : 'Soon';

      const activity: CommunityActivity = {
        id: created.id,
        title: created.title,
        description: created.description ?? 'No description provided.',
        type: newActivity.type,
        creatorName: 'You',
        participantsCount: created.participants_count ?? 1,
        isFriendHost: false,
        scheduledFor: whenLabel,
        city: created.city,
        locationDetails: created.location_details ?? undefined,
        isCreator: true,
      };

      setMyActivities((prev) => [activity, ...prev]);
      setAllPublicActivities((prev) => [activity, ...prev]);
    } catch (err) {
      console.error('Unexpected error creating activity', err);
      alert('Unexpected error creating activity. Please try again.');
    }
  }

  async function handleConfirmJoin(activityId: string) {
    if (!selectedActivity) return;

    setJoinLoading(true);
    setJoinError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      setJoinError('You must be logged in to join activities.');
      setJoinLoading(false);
      return;
    }

    const accessToken = sessionData.session.access_token;

    try {
      const res = await fetch(
        `${backendUrl}/api/activities/${activityId}/join`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to join activity.';
        console.error('Join activity failed', msg);
        setJoinError(msg);
        setJoinLoading(false);
        return;
      }

      setMyActivities((prev) => {
        const exists = prev.some((a) => a.id === activityId);
        if (exists) {
          return prev;
        }
        // joined activities are not creators
        return [{ ...selectedActivity, isCreator: false }, ...prev];
      });

      setAllPublicActivities((prev) =>
        prev.filter((a) => a.id !== activityId)
      );
      setPublicActivities((prev) =>
        prev.filter((a) => a.id !== activityId)
      );

      setJoinLoading(false);
      setSelectedActivity(null);
    } catch (err) {
      console.error('Unexpected error joining activity', err);
      setJoinError('Unexpected error joining activity. Please try again.');
      setJoinLoading(false);
    }
  }

  async function handleConfirmLeave(activityId: string) {
    setJoinLoading(true);
    setJoinError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      setJoinError('You must be logged in to leave activities.');
      setJoinLoading(false);
      return;
    }

    const accessToken = sessionData.session.access_token;

    try {
      const res = await fetch(
        `${backendUrl}/api/activities/${activityId}/leave`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to leave activity.';
        console.error('Leave activity failed', msg);
        setJoinError(msg);
        setJoinLoading(false);
        return;
      }

      const leftActivity = myActivities.find((a) => a.id === activityId);

      setMyActivities((prev) => prev.filter((a) => a.id !== activityId));

      if (leftActivity) {
        setAllPublicActivities((prev) => {
          const exists = prev.some((a) => a.id === activityId);
          if (exists) return prev;
          return [leftActivity, ...prev];
        });

        setPublicActivities((prev) => {
          const exists = prev.some((a) => a.id === activityId);
          if (exists) return prev;
          return [leftActivity, ...prev];
        });
      }

      setJoinLoading(false);
      setConfirmLeaveForId(null);
    } catch (err) {
      console.error('Unexpected error leaving activity', err);
      setJoinError('Unexpected error leaving activity. Please try again.');
      setJoinLoading(false);
    }
  }

  function handleRequestLeave(activityId: string) {
    setConfirmLeaveForId(activityId);
  }

  // Delete activity (creator only)
  async function handleDeleteActivity(activityId: string) {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    setDeleteError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      setDeleteError('You must be logged in to delete activities.');
      return;
    }

    const accessToken = sessionData.session.access_token;

    try {
      const res = await fetch(`${backendUrl}/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to delete activity.';
        console.error('Delete activity failed', msg);
        setDeleteError(msg);
        return;
      }

      // Remove from all lists
      setMyActivities((prev) => prev.filter((a) => a.id !== activityId));
      setAllPublicActivities((prev) =>
        prev.filter((a) => a.id !== activityId)
      );
      setPublicActivities((prev) =>
        prev.filter((a) => a.id !== activityId)
      );
    } catch (err) {
      console.error('Unexpected error deleting activity', err);
      setDeleteError('Unexpected error deleting activity. Please try again.');
    }
  }

  // Open invite modal + load joined/invited info
  async function handleOpenInvite(activityId: string) {
    const found = myActivities.find((a) => a.id === activityId);
    if (!found) {
      console.warn('Activity not found in myActivities', activityId);
      return;
    }
    setInviteActivity(found);
    setInviteError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      return;
    }
    const accessToken = sessionData.session.access_token;

    try {
      // Members of this activity
      const membersRes = await fetch(
        `${backendUrl}/api/activities/${activityId}/members`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (membersRes.ok) {
        const membersJson = await membersRes.json();
        const memberIds = (membersJson.members ?? []) as string[];
        setJoinedFriendIds(new Set(memberIds));
      } else {
        setJoinedFriendIds(new Set());
      }

      // Invitations created by me for this activity
      const invRes = await fetch(
        `${backendUrl}/api/activities/${activityId}/invitations/mine`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (invRes.ok) {
        const invJson = await invRes.json();
        const invitations = (invJson.invitations ?? []) as {
          invitee_user_id: string;
          status: 'pending' | 'accepted' | 'declined';
        }[];

        const invitedIds = new Set(
          invitations
            .filter((i) => i.status === 'pending')
            .map((i) => i.invitee_user_id)
        );
        setInvitedFriendIds(invitedIds);
      } else {
        setInvitedFriendIds(new Set());
      }
    } catch (err) {
      console.error('Error loading invite state for activity', err);
      setJoinedFriendIds(new Set());
      setInvitedFriendIds(new Set());
    }
  }

  // Send invitation
  async function handleInviteFriend(friendId: string) {
    if (!inviteActivity) return;

    setInviteLoading(true);
    setInviteError(null);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      setInviteError('You must be logged in to invite friends.');
      setInviteLoading(false);
      return;
    }

    const accessToken = sessionData.session.access_token;

    try {
      const res = await fetch(
        `${backendUrl}/api/activities/${inviteActivity.id}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ invitee_user_id: friendId }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to send invitation.';
        console.error('Invite friend failed', msg);
        setInviteError(msg);
        setInviteLoading(false);
        return;
      }

      // Mark friend as invited in UI
      setInvitedFriendIds((prev) => {
        const next = new Set(prev);
        next.add(friendId);
        return next;
      });

      setInviteError(null);
      setInviteLoading(false);
      // Optionally close modal here if you want:
      // setInviteActivity(null);
    } catch (err) {
      console.error('Unexpected error inviting friend', err);
      setInviteError('Unexpected error inviting friend. Please try again.');
      setInviteLoading(false);
    }
  }

  const activityToConfirmLeave =
    confirmLeaveForId &&
    myActivities.find((a) => a.id === confirmLeaveForId);

  return (
    <div
      className="community-page-root"
      style={{
        background: BRAND.bg,
        color: BRAND.text,
        // theme variables for CSS
        ['--community-border-color' as any]: BRAND.border,
        ['--community-card-shadow' as any]: BRAND.cardShadow,
        ['--community-soft-shadow' as any]: BRAND.softShadow,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="community-page-blob community-page-blob--tl"
        style={{ background: BRAND.brandGradient }}
      />
      <div
        className="community-page-blob community-page-blob--br"
        style={{ background: BRAND.brandGradient }}
      />

      {/* Top bar */}
      <header className="community-page-header">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="community-page-back-button"
          style={{ color: BRAND.muted }}
        >
          <span style={{ fontSize: 18 }}>←</span>
          <span>Back to dashboard</span>
        </button>

        <h1
          className="community-page-title"
          style={{ color: BRAND.text }}
        >
          Community
        </h1>

        <div style={{ width: 80 }} />
      </header>

      {/* Main */}
      <main className="community-page-main">
        {/* Intro card */}
        <section className="community-page-intro">
          <h2
            className="community-page-intro-title"
            style={{ color: BRAND.text }}
          >
            Join walks and challenges
          </h2>
          <p
            className="community-page-intro-text"
            style={{ color: BRAND.muted }}
          >
            Discover community activities, create your own challenges, and see
            what your friends are up to.
          </p>
        </section>

        {/* Your activities */}
        <MyActivitiesSection
          activities={myActivities}
          loading={myActivitiesLoading}
          error={myActivitiesError}
          onLeave={handleRequestLeave}
          onOpenChat={(id) => {
            const found = myActivities.find((a) => a.id === id);
            if (found) {
              setChatActivity(found);
            }
          }}
          onInviteFriends={handleOpenInvite}
          onDelete={handleDeleteActivity}
          deleteError={deleteError}
        />

        {/* Public activities */}
        <PublicActivitiesSection
          activities={publicActivities}
          loading={publicLoading}
          error={publicError}
          cityFilter={cityFilter}
          onCityFilterChange={setCityFilter}
          friendsOnly={friendsOnly}
          onFriendsOnlyChange={setFriendsOnly}
          onViewJoin={handleOpenJoinModal}
        />
      </main>

      <CreateActivityWidget onCreate={handleCreateActivity} />

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          open={!!selectedActivity}
          joinLoading={joinLoading}
          joinError={joinError}
          onClose={() => {
            if (!joinLoading) setSelectedActivity(null);
          }}
          onConfirmJoin={() => handleConfirmJoin(selectedActivity.id)}
        />
      )}

      {/* Activity chat modal */}
      {chatActivity && (
        <ActivityChatModal
          activity={chatActivity}
          open={!!chatActivity}
          onClose={() => setChatActivity(null)}
        />
      )}

      {/* Invite friends modal */}
      <ActivityInviteModal
        open={!!inviteActivity}
        activity={inviteActivity}
        friends={friendsForInvites}
        inviting={inviteLoading}
        inviteError={inviteError}
        joinedFriendIds={joinedFriendIds}
        invitedFriendIds={invitedFriendIds}
        onClose={() => {
          if (!inviteLoading) {
            setInviteActivity(null);
            setInviteError(null);
            setJoinedFriendIds(new Set());
            setInvitedFriendIds(new Set());
          }
        }}
        onInviteFriend={handleInviteFriend}
      />

      {/* Leave confirmation modal */}
      {activityToConfirmLeave && (
        <div
          className="community-page-leave-overlay"
          onClick={() => {
            if (!joinLoading) {
              setConfirmLeaveForId(null);
            }
          }}
        >
          <div
            className="community-page-leave-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="community-page-leave-title"
              style={{ color: BRAND.text }}
            >
              Leave activity?
            </h3>
            <p
              className="community-page-leave-text"
              style={{ color: BRAND.muted }}
            >
              You are about to leave “{activityToConfirmLeave.title}”. You will
              need to join again from the public list if you change your mind.
            </p>

            {joinError && (
              <p className="community-page-leave-error">{joinError}</p>
            )}

            <div className="community-page-leave-actions">
              <button
                type="button"
                onClick={() => !joinLoading && setConfirmLeaveForId(null)}
                className="community-page-leave-cancel"
                style={{ color: BRAND.muted }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  activityToConfirmLeave &&
                  handleConfirmLeave(activityToConfirmLeave.id)
                }
                disabled={joinLoading}
                className="community-page-leave-confirm"
                style={{
                  opacity: joinLoading ? 0.75 : 1,
                  cursor: joinLoading ? 'default' : 'pointer',
                }}
              >
                {joinLoading ? 'Leaving...' : 'Leave activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;