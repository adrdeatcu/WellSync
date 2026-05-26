// src/components/ActivityCard.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import type { CommunityActivity } from '../pages/CommunityPage';

interface ActivityCardProps {
  activity: CommunityActivity;
  mode: 'public' | 'mine';
  onViewJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  mode,
  onViewJoin,
  onLeave,
}) => {
  const hasParticipants = activity.participantsCount > 0;

  return (
    <div
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
        </div>

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

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            color: BRAND.muted,
          }}
        >
          {activity.description}
        </p>

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

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 11,
            color: '#8aa19f',
          }}
        >
          {activity.scheduledFor}
        </p>

        {hasParticipants && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 11,
              color: '#4b6b69',
            }}
          >
            {activity.participantsCount === 1
              ? '1 person joined'
              : `${activity.participantsCount} people joined`}
          </p>
        )}
      </div>

      {mode === 'mine' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            alignSelf: 'center',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#8aa19f',
            }}
          >
            Created / joined
          </span>
          {onLeave && (
            <button
              type="button"
              onClick={() => onLeave(activity.id)}
              style={{
                marginTop: 2,
                border: 'none',
                borderRadius: 999,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#b91c1c',
                color: '#ffffff',
                boxShadow: BRAND.softShadow,
              }}
            >
              Leave
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onViewJoin && onViewJoin(activity.id)}
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
          View / Join
        </button>
      )}
    </div>
  );
};

export default ActivityCard;