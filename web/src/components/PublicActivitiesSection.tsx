// src/components/PublicActivitiesSection.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import ActivityCard from './ActivityCard';
import type { CommunityActivity } from '../pages/CommunityPage';

interface PublicActivitiesSectionProps {
  activities: CommunityActivity[];
  loading: boolean;
  error: string | null;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  friendsOnly: boolean;
  onFriendsOnlyChange: (value: boolean) => void;
  onViewJoin: (activityId: string) => void;
}

const PublicActivitiesSection: React.FC<PublicActivitiesSectionProps> = ({
  activities,
  loading,
  error,
  cityFilter,
  onCityFilterChange,
  friendsOnly,
  onFriendsOnlyChange,
  onViewJoin,
}) => {
  return (
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
              onChange={(e) => onCityFilterChange(e.target.value)}
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
              onChange={(e) => onFriendsOnlyChange(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Friends’ activities only</span>
          </label>
        </div>
      </div>

      {loading && (
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

      {!loading && !error && (
        <div
          style={{
            marginTop: activities.length ? 0 : 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {activities.length === 0 ? (
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
            activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                mode="public"
                onViewJoin={onViewJoin}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default PublicActivitiesSection;