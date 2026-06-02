// src/components/ActivityInviteModal.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import type { CommunityActivity } from '../pages/CommunityPage';

export interface InviteFriend {
  id: string;
  name: string;
}

interface ActivityInviteModalProps {
  open: boolean;
  activity: CommunityActivity | null;
  friends: InviteFriend[];
  inviting: boolean;
  inviteError: string | null;
  joinedFriendIds: Set<string>;
  invitedFriendIds: Set<string>;
  onClose: () => void;
  onInviteFriend: (friendId: string) => void;
}

const ActivityInviteModal: React.FC<ActivityInviteModalProps> = ({
  open,
  activity,
  friends,
  inviting,
  inviteError,
  joinedFriendIds,
  invitedFriendIds,
  onClose,
  onInviteFriend,
}) => {
  if (!open || !activity) return null;

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
        zIndex: 70,
      }}
      onClick={() => {
        if (!inviting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
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
            marginBottom: 6,
          }}
        >
          Invite friends
        </h3>
        <p
          style={{
            margin: '4px 0 10px',
            fontSize: 13,
            color: BRAND.muted,
          }}
        >
          Choose friends to invite to “{activity.title}”.
        </p>

        {inviteError && (
          <p
            style={{
              margin: '4px 0 8px',
              fontSize: 12,
              color: '#b00020',
            }}
          >
            {inviteError}
          </p>
        )}

        {friends.length === 0 ? (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: BRAND.muted,
            }}
          >
            You have no friends to invite yet.
          </p>
        ) : (
          <div
            style={{
              maxHeight: 260,
              overflowY: 'auto',
              marginTop: 4,
              paddingRight: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {friends.map((friend) => {
              const joined = joinedFriendIds.has(friend.id);
              const invited = invitedFriendIds.has(friend.id);

              let rightLabel: React.ReactNode;
              if (joined) {
                rightLabel = (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#16a34a',
                      fontWeight: 600,
                    }}
                  >
                    Joined
                  </span>
                );
              } else if (invited) {
                rightLabel = (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#8aa19f',
                      fontWeight: 600,
                    }}
                  >
                    Invited
                  </span>
                );
              } else {
                rightLabel = (
                  <button
                    type="button"
                    disabled={inviting}
                    onClick={() => onInviteFriend(friend.id)}
                    style={{
                      borderRadius: 999,
                      border: 'none',
                      background: BRAND.brandGradient,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: inviting ? 'default' : 'pointer',
                      color: '#ffffff',
                      boxShadow: BRAND.softShadow,
                      opacity: inviting ? 0.75 : 1,
                    }}
                  >
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                );
              }

              return (
                <div
                  key={friend.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: 10,
                    border: `1px solid ${BRAND.border}`,
                    background: '#ffffff',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: BRAND.text,
                    }}
                  >
                    {friend.name}
                  </span>
                  {rightLabel}
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={inviting}
            style={{
              borderRadius: 999,
              border: `1px solid ${BRAND.border}`,
              background: '#ffffff',
              padding: '6px 12px',
              fontSize: 13,
              cursor: inviting ? 'default' : 'pointer',
              color: BRAND.muted,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityInviteModal;