// src/pages/CommunityPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from './DashboardPage';
import CreateActivityWidget from '../components/CreateActivityWidget';

export interface CommunityActivity {
  id: string;
  title: string;
  description: string;
  type: 'walk' | 'run' | 'steps' | 'challenge';
  creatorName: string;
  participantsCount: number;
  isFriendHost: boolean;
  scheduledFor: string; // simple text for display
  city?: string;
  locationDetails?: string;
}

const mockActivities: CommunityActivity[] = [
  {
    id: '1',
    title: 'Evening 5k Walk',
    description: 'Gentle walk around the park, all paces welcome.',
    type: 'walk',
    creatorName: 'Alex M.',
    participantsCount: 8,
    isFriendHost: true,
    scheduledFor: 'Today · 18:00',
  },
  {
    id: '2',
    title: '10,000 Steps Daily Challenge',
    description: 'Hit 10k steps every day this week.',
    type: 'steps',
    creatorName: 'WellSync Community',
    participantsCount: 42,
    isFriendHost: false,
    scheduledFor: 'This week',
  },
  {
    id: '3',
    title: 'Morning Run Club',
    description: 'Short 3k run with light stretching afterwards.',
    type: 'run',
    creatorName: 'Dana K.',
    participantsCount: 15,
    isFriendHost: false,
    scheduledFor: 'Tomorrow · 07:30',
  },
];

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();

  const [myActivities, setMyActivities] = React.useState<CommunityActivity[]>(
    []
  );

  function handleBackToDashboard() {
    navigate('/dashboard');
  }

  function handleJoin(activityId: string) {
    console.log('Join activity', activityId);
  }

  function handleCreateActivity(newActivity: {
    title: string;
    description: string;
    type: CommunityActivity['type'];
    city: string;
    locationDetails: string;
    startTime: string;
    endTime: string;
    isPublic: boolean;
  }) {
    const whenLabel =
      newActivity.startTime && newActivity.endTime
        ? 'Planned • ' + newActivity.startTime.replace('T', ' ')
        : 'Soon';

    const activity: CommunityActivity = {
      id: Date.now().toString(),
      title: newActivity.title.trim(),
      description:
        newActivity.description.trim() || 'No description provided.',
      type: newActivity.type,
      creatorName: 'You',
      participantsCount: 1,
      isFriendHost: false,
      scheduledFor: whenLabel,
      city: newActivity.city.trim(),
      locationDetails: newActivity.locationDetails.trim() || undefined,
    };

    setMyActivities((prev) => [activity, ...prev]);
    console.log('Prepared activity payload (for backend later):', newActivity);
  }

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
        {myActivities.length > 0 && (
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {myActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: 12,
                    borderRadius: 14,
                    border: `1px solid ${BRAND.border}`,
                    background: '#ffffff',
                  }}
                >
                  <div style={{ flex: 1, marginRight: 10 }}>
                    {/* Title + type */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: BRAND.text,
                        }}
                      >
                        {activity.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#e3f2ef',
                          color: BRAND.primary,
                          textTransform: 'capitalize',
                        }}
                      >
                        {activity.type}
                      </span>
                    </div>

                    {/* City highlighted just under title */}
                    {activity.city && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#dbeafe',
                          fontSize: 11,
                          color: '#1d4ed8',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                          }}
                        >
                          📍
                        </span>
                        <span>{activity.city}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: BRAND.muted,
                      }}
                    >
                      {activity.description}
                    </p>

                    {/* Location details below description */}
                    {activity.locationDetails && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 12,
                          color: '#4a6e6c',
                        }}
                      >
                        Details: {activity.locationDetails}
                      </p>
                    )}

                    {/* Time */}
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: '#8aa19f',
                      }}
                    >
                      {activity.scheduledFor}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      color: '#8aa19f',
                      alignSelf: 'center',
                    }}
                  >
                    Created by you
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggested activities */}
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
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: BRAND.text,
              }}
            >
              Suggested activities
            </h3>
            <span
              style={{
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              {mockActivities.length} available
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${BRAND.border}`,
                  background: '#ffffff',
                }}
              >
                <div style={{ flex: 1, marginRight: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: BRAND.text,
                      }}
                    >
                      {activity.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#e3f2ef',
                        color: BRAND.primary,
                        textTransform: 'capitalize',
                      }}
                    >
                      {activity.type}
                    </span>
                    {activity.isFriendHost && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#fef3c7',
                          color: '#92400e',
                        }}
                      >
                        Friend hosting
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: BRAND.muted,
                    }}
                  >
                    {activity.description}
                  </p>

                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      fontSize: 12,
                      color: BRAND.muted,
                    }}
                  >
                    <span>Host: {activity.creatorName}</span>
                    <span>•</span>
                    <span>{activity.participantsCount} joined</span>
                    <span>•</span>
                    <span>{activity.scheduledFor}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoin(activity.id)}
                  style={{
                    alignSelf: 'center',
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: BRAND.brandGradient,
                    color: '#ffffff',
                    boxShadow: BRAND.softShadow,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <CreateActivityWidget onCreate={handleCreateActivity} />
    </div>
  );
};

export default CommunityPage;