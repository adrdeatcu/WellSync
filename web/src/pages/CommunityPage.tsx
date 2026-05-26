// src/pages/CommunityPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from './DashboardPage';
import CreateActivityWidget from '../components/CreateActivityWidget';
import ActivityCard from '../components/ActivityCard';
import ActivityModal from '../components/ActivityModal';
import ActivityChatModal from '../components/ActivityChatModal';
import { supabase } from '../supabaseClient';

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
        }[];

        if (cancelled) return;

        const mapped: CommunityActivity[] = activities.map((a) => {
          const whenLabel =
            'Starts • ' + new Date(a.start_time_utc).toLocaleString();

          return {
            id: a.id,
            title: a.title,
            description: a.description ?? 'No description provided.',
            type: 'walk',
            // For "Your activities" we keep showing "You"
            creatorName: 'You',
            participantsCount: a.participants_count ?? 0,
            isFriendHost: false,
            scheduledFor: whenLabel,
            city: a.city,
            locationDetails: a.location_details ?? undefined,
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

      // Add to "Your activities" if not already there
      setMyActivities((prev) => {
        const exists = prev.some((a) => a.id === activityId);
        if (exists) {
          return prev;
        }
        return [selectedActivity, ...prev];
      });

      // Remove from public lists so it no longer shows there
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

      // Remove from "Your activities"
      setMyActivities((prev) => prev.filter((a) => a.id !== activityId));

      if (leftActivity) {
        // Add back into public lists if not present
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

  // Trigger confirm modal when clicking Leave on a card
  function handleRequestLeave(activityId: string) {
    setConfirmLeaveForId(activityId);
  }

  const activityToConfirmLeave =
    confirmLeaveForId &&
    myActivities.find((a) => a.id === confirmLeaveForId);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: BRAND.bg,
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: BRAND.text,
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: -160,
          left: -160,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: BRAND.brandGradient,
          opacity: 0.35,
          filter: 'blur(80px)',
        }}
      />
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          bottom: -180,
          right: -180,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: BRAND.brandGradient,
          opacity: 0.28,
          filter: 'blur(90px)',
        }}
      />

      {/* Top bar */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <button
          type="button"
          onClick={handleBackToDashboard}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: BRAND.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 18 }}>←</span>
          <span>Back to dashboard</span>
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: BRAND.text,
          }}
        >
          Community
        </h1>

        <div style={{ width: 80 }} />
      </header>

      {/* Main */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 820,
          margin: '30px auto',
          padding: '0 20px 40px',
        }}
      >
        {/* Intro card */}
        <section
          style={{
            padding: 20,
            borderRadius: 20,
            border: `1px solid ${BRAND.border}`,
            background: 'rgba(255,255,255,0.92)',
            boxShadow: BRAND.cardShadow,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: BRAND.text,
            }}
          >
            Join walks and challenges
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: BRAND.muted,
            }}
          >
            Discover community activities, create your own challenges, and see
            what your friends are up to.
          </p>
        </section>

        {/* Your activities */}
        {(myActivities.length > 0 ||
          myActivitiesLoading ||
          myActivitiesError) && (
          <section
            style={{
              borderRadius: 20,
              border: `1px solid ${BRAND.border}`,
              background: 'rgba(255,255,255,0.9)',
              boxShadow: BRAND.cardShadow,
              padding: 18,
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: BRAND.text,
                marginBottom: 10,
              }}
            >
              Your activities
            </h3>

            {myActivitiesLoading && (
              <p
                style={{
                  fontSize: 12,
                  color: BRAND.muted,
                  margin: '4px 0 0',
                }}
              >
                Loading your activities...
              </p>
            )}

            {myActivitiesError && (
              <p
                style={{
                  fontSize: 12,
                  color: '#b00020',
                  margin: '4px 0 0',
                }}
              >
                {myActivitiesError}
              </p>
            )}

            {!myActivitiesLoading &&
              !myActivitiesError &&
              myActivities.length === 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: BRAND.muted,
                    margin: '4px 0 0',
                  }}
                >
                  You have no activities yet.
                </p>
              )}

            {!myActivitiesLoading &&
              !myActivitiesError &&
              myActivities.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {myActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      mode="mine"
                      onLeave={handleRequestLeave}
                      onOpenChat={(id) => {
                        const found = myActivities.find((a) => a.id === id);
                        if (found) {
                          setChatActivity(found);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
          </section>
        )}

        {/* Public activities */}
        <section
          style={{
            borderRadius: 20,
            border: `1px solid ${BRAND.border}`,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: BRAND.cardShadow,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: BRAND.text,
                }}
              >
                Public activities
              </h3>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                Filter by city or view all public activities.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 12,
                    color: BRAND.muted,
                  }}
                >
                  City:
                </label>
                <input
                  type="text"
                  placeholder="All cities"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: `1px solid ${BRAND.border}`,
                    minWidth: 140,
                  }}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: BRAND.muted,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={friendsOnly}
                  onChange={(e) => setFriendsOnly(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Friends’ activities only</span>
              </label>
            </div>
          </div>

          {publicLoading && (
            <p
              style={{
                fontSize: 12,
                color: BRAND.muted,
                margin: '4px 0 0',
              }}
            >
              Loading activities...
            </p>
          )}

          {publicError && (
            <p
              style={{
                fontSize: 12,
                color: '#b00020',
                margin: '4px 0 0',
              }}
            >
              {publicError}
            </p>
          )}

          {!publicLoading && !publicError && (
            <div
              style={{
                marginTop: publicActivities.length ? 0 : 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {publicActivities.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: BRAND.muted,
                    margin: 0,
                  }}
                >
                  No public activities available yet.
                </p>
              ) : (
                publicActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    mode="public"
                    onViewJoin={handleOpenJoinModal}
                  />
                ))
              )}
            </div>
          )}
        </section>
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

      {/* Leave confirmation modal */}
      {activityToConfirmLeave && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 40, 42, 0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
          onClick={() => {
            if (!joinLoading) {
              setConfirmLeaveForId(null);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.97)',
              boxShadow: BRAND.cardShadow,
              border: `1px solid ${BRAND.border}`,
              padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: BRAND.text,
                marginBottom: 8,
              }}
            >
              Leave activity?
            </h3>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 13,
                color: BRAND.muted,
              }}
            >
              You are about to leave “{activityToConfirmLeave.title}”. You will
              need to join again from the public list if you change your mind.
            </p>

            {joinError && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: '#b00020',
                }}
              >
                {joinError}
              </p>
            )}

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => !joinLoading && setConfirmLeaveForId(null)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${BRAND.border}`,
                  background: '#ffffff',
                  padding: '6px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: BRAND.muted,
                }}
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
                style={{
                  borderRadius: 999,
                  border: 'none',
                  background: '#b91c1c',
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: joinLoading ? 'default' : 'pointer',
                  color: '#ffffff',
                  boxShadow: BRAND.softShadow,
                  opacity: joinLoading ? 0.75 : 1,
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