// src/components/FriendsPanel.tsx
import React from 'react';
import type {
  FriendUser,
  FriendsOverviewResponse,
} from '../types/friends';

interface FriendsPanelProps {
  BRAND: {
    border: string;
    text: string;
    muted: string;
    brandGradient: string;
  };

  friendsData: FriendsOverviewResponse | null;
  friendsLoading: boolean;
  friendsError: string | null;
  friendsListOpen: boolean;
  setFriendsListOpen: React.Dispatch<React.SetStateAction<boolean>>;

  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: FriendUser[];
  searchLoading: boolean;
  searchError: string | null;

  onSearchSubmit: (e: React.FormEvent) => void;
  onSendFriendRequest: (userId: string) => void;
  onAcceptFriend: (userId: string) => void;
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({
  BRAND,
  friendsData,
  friendsLoading,
  friendsError,
  friendsListOpen,
  setFriendsListOpen,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLoading,
  searchError,
  onSearchSubmit,
  onSendFriendRequest,
  onAcceptFriend,
}) => {
  const isFriend = (userId: string) =>
    friendsData?.friends.some((f) => f.id === userId) ?? false;

  const hasOutgoingRequest = (userId: string) =>
    friendsData?.outgoing_requests.some((f) => f.id === userId) ?? false;

  const hasIncomingRequest = (userId: string) =>
    friendsData?.incoming_requests.some((f) => f.id === userId) ?? false;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          cursor: 'pointer',
        }}
        onClick={() => setFriendsListOpen((v) => !v)}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: BRAND.text,
          }}
        >
          Friends & requests
        </div>
        <span
          style={{
            fontSize: 18,
            lineHeight: 1,
            transform: friendsListOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            color: BRAND.muted,
          }}
        >
          ›
        </span>
      </div>

      {friendsListOpen && (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
            padding: 10,
            background: '#f5faf8',
          }}
        >
          {/* Search */}
          <form onSubmit={onSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${BRAND.border}`,
                fontSize: 13,
                marginBottom: 6,
              }}
            />
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: BRAND.brandGradient,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor:
                  searchLoading || !searchQuery.trim() ? 'default' : 'pointer',
                opacity: searchLoading || !searchQuery.trim() ? 0.7 : 1,
                marginBottom: 8,
              }}
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {searchError && (
            <div
              style={{
                fontSize: 12,
                color: '#b00020',
                marginBottom: 6,
              }}
            >
              {searchError}
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div
              style={{
                marginBottom: 8,
                borderBottom: `1px solid ${BRAND.border}`,
                paddingBottom: 6,
                maxHeight: 120,
                overflowY: 'auto',
              }}
            >
              {searchResults.map((u: FriendUser) => {
                const alreadyFriend = isFriend(u.id);
                const outgoing = hasOutgoingRequest(u.id);
                const incoming = hasIncomingRequest(u.id);

                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                      padding: '4px 0',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {u.full_name ?? 'Unnamed'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: BRAND.muted,
                        }}
                      >
                        {u.username ? `@${u.username}` : 'No username'}
                      </div>
                    </div>

                    {/* Right side: state-aware actions */}
                    {alreadyFriend ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#8aa19f',
                        }}
                      >
                        Already friends
                      </span>
                    ) : outgoing ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#8aa19f',
                        }}
                      >
                        Request sent
                      </span>
                    ) : incoming ? (
                      <button
                        type="button"
                        onClick={() => onAcceptFriend(u.id)}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '3px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#16a34a',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSendFriendRequest(u.id)}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            'linear-gradient(135deg,#1f5f63,#7cc2b5)',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {friendsError && (
            <div
              style={{
                fontSize: 12,
                color: '#b00020',
                marginBottom: 6,
              }}
            >
              {friendsError}
            </div>
          )}

          {/* Friends overview */}
          {friendsLoading ? (
            <div
              style={{
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              Loading friends…
            </div>
          ) : friendsData ? (
            <div style={{ fontSize: 13 }}>
              {/* Incoming */}
              <div style={{ marginBottom: 6 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: BRAND.muted,
                    marginBottom: 2,
                  }}
                >
                  Incoming requests
                </div>
                {friendsData.incoming_requests.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#8aa19f',
                    }}
                  >
                    None
                  </div>
                ) : (
                  friendsData.incoming_requests.map((u: FriendUser) => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '3px 0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {u.full_name ?? 'Unnamed'}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: BRAND.muted,
                          }}
                        >
                          {u.username ? `@${u.username}` : 'No username'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAcceptFriend(u.id)}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '3px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#16a34a',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Outgoing */}
              <div style={{ marginBottom: 6 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: BRAND.muted,
                    marginBottom: 2,
                  }}
                >
                  Sent requests
                </div>
                {friendsData.outgoing_requests.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#8aa19f',
                    }}
                  >
                    None
                  </div>
                ) : (
                  friendsData.outgoing_requests.map((u: FriendUser) => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '3px 0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {u.full_name ?? 'Unnamed'}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: BRAND.muted,
                          }}
                        >
                          {u.username ? `@${u.username}` : 'No username'}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#8aa19f',
                        }}
                      >
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Friends */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: BRAND.muted,
                    marginBottom: 2,
                  }}
                >
                  Friends
                </div>
                {friendsData.friends.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#8aa19f',
                    }}
                  >
                    You have no friends yet.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                    }}
                  >
                    {friendsData.friends.map((u: FriendUser) => (
                      <div
                        key={u.id}
                        style={{
                          padding: '3px 0',
                          borderBottom: '1px solid rgba(31,95,99,0.06)',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {u.full_name ?? 'Unnamed'}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: BRAND.muted,
                          }}
                        >
                          {u.username ? `@${u.username}` : 'No username'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: '#8aa19f',
              }}
            >
              No friends loaded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsPanel;