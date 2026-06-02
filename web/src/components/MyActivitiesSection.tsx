// src/components/MyActivitiesSection.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import ActivityCard from './ActivityCard';
import type { CommunityActivity } from '../pages/CommunityPage';

interface MyActivitiesSectionProps {
  activities: CommunityActivity[];
  loading: boolean;
  error: string | null;
  onLeave: (activityId: string) => void;
  onOpenChat: (activityId: string) => void;
  onInviteFriends: (activityId: string) => void;
  // NEW: delete support (creator only)
  onDelete?: (activityId: string) => void;
  deleteError?: string | null;
}

const MyActivitiesSection: React.FC<MyActivitiesSectionProps> = ({
  activities,
  loading,
  error,
  onLeave,
  onOpenChat,
  onInviteFriends,
  onDelete,
  deleteError,
}) => {
  // Render nothing if section is empty and no loading/error (keeps old behaviour)
  if (!loading && !error && activities.length === 0) {
    return null;
  }

  return (
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

      {loading && (
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

      {error && (
        <p
          style={{
            fontSize: 12,
            color: '#b00020',
            margin: '4px 0 0',
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && activities.length === 0 && (
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

      {!loading && !error && activities.length > 0 && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              mode="mine"
              onLeave={onLeave}
              onOpenChat={onOpenChat}
              onInviteFriends={onInviteFriends}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {deleteError && (
        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#b00020',
          }}
        >
          {deleteError}
        </p>
      )}
    </section>
  );
};

export default MyActivitiesSection;