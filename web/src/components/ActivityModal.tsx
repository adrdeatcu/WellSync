// src/components/ActivityModal.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import type { CommunityActivity } from '../pages/CommunityPage';

interface ActivityModalProps {
  activity: CommunityActivity;
  open: boolean;
  joinLoading: boolean;
  joinError: string | null;
  onClose: () => void;
  onConfirmJoin: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  activity,
  open,
  joinLoading,
  joinError,
  onClose,
  onConfirmJoin,
}) => {
  if (!open) return null;

  const hasParticipants = activity.participantsCount > 0;

  return (
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
        zIndex: 50,
      }}
      onClick={() => {
        if (!joinLoading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: BRAND.cardShadow,
          border: `1px solid ${BRAND.border}`,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
            {activity.title}
          </h3>
          <button
            type="button"
            onClick={() => !joinLoading && onClose()}
            style={{
              border: 'none',
              background: '#eef5f3',
              width: 28,
              height: 28,
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 16,
              color: BRAND.primary,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {activity.city && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#dbeafe',
              fontSize: 11,
              color: '#1d4ed8',
            }}
          >
            <span style={{ fontSize: 12 }}>📍</span>
            <span>{activity.city}</span>
          </div>
        )}

        <p
          style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: BRAND.muted,
          }}
        >
          {activity.description}
        </p>

        {activity.locationDetails && (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: '#4a6e6c',
            }}
          >
            Details: {activity.locationDetails}
          </p>
        )}

        <p
          style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: '#8aa19f',
          }}
        >
          {activity.scheduledFor}
        </p>

        {hasParticipants && (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 12,
              color: '#4b6b69',
            }}
          >
            {activity.participantsCount === 1
              ? '1 person has joined this activity'
              : `${activity.participantsCount} people have joined this activity`}
          </p>
        )}

        <p
          style={{
            margin: '10px 0 0',
            fontSize: 12,
            color: BRAND.muted,
          }}
        >
          Hosted by {activity.creatorName}
          {activity.isFriendHost && ' (friend host)'}
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
            onClick={() => !joinLoading && onClose()}
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
            onClick={onConfirmJoin}
            disabled={joinLoading}
            style={{
              borderRadius: 999,
              border: 'none',
              background: BRAND.brandGradient,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: joinLoading ? 'default' : 'pointer',
              color: '#ffffff',
              boxShadow: BRAND.softShadow,
              opacity: joinLoading ? 0.75 : 1,
            }}
          >
            {joinLoading ? 'Joining...' : 'Join activity'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;