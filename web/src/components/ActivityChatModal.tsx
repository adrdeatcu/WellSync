// src/components/ActivityChatModal.tsx
import React from 'react';
import { BRAND } from '../pages/DashboardPage';
import type { CommunityActivity } from '../pages/CommunityPage';
import { supabase } from '../supabaseClient';

const backendUrl =
  process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

export interface ActivityMessage {
  id: number;
  activity_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
}

interface ActivityChatModalProps {
  activity: CommunityActivity;
  open: boolean;
  onClose: () => void;
}

const ActivityChatModal: React.FC<ActivityChatModalProps> = ({
  activity,
  open,
  onClose,
}) => {
  const [messages, setMessages] = React.useState<ActivityMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [input, setInput] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError(null);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Not logged in or cannot get session', sessionError);
        setError('You must be logged in to view messages.');
        setLoading(false);
        return;
      }

      const accessToken = sessionData.session.access_token;

      try {
        const res = await fetch(
          `${backendUrl}/api/activities/${activity.id}/messages`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const msg = errJson?.error ?? 'Failed to load messages.';
          console.error('Load activity messages failed', msg);
          if (!cancelled) {
            setError(msg);
          }
          return;
        }

        const json = await res.json();
        const msgs = (json.messages ?? []) as ActivityMessage[];
        if (!cancelled) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Unexpected error loading messages', err);
        if (!cancelled) {
          setError('Unexpected error loading messages.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [open, activity.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Not logged in or cannot get session', sessionError);
      setError('You must be logged in to send messages.');
      return;
    }

    const accessToken = sessionData.session.access_token;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `${backendUrl}/api/activities/${activity.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to send message.';
        console.error('Send activity message failed', msg);
        setError(msg);
        setSending(false);
        return;
      }

      const json = await res.json();
      const message = json.message as ActivityMessage;

      setMessages((prev) => [...prev, message]);
      setInput('');
      setSending(false);
    } catch (err) {
      console.error('Unexpected error sending message', err);
      setError('Unexpected error sending message. Please try again.');
      setSending(false);
    }
  }

  if (!open) return null;

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
        zIndex: 55,
      }}
      onClick={() => {
        if (!sending) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          borderRadius: 18,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: BRAND.cardShadow,
          border: `1px solid ${BRAND.border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
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
              {activity.title}
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              Activity chat · {activity.city ?? 'No city specified'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !sending && onClose()}
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

        {/* Messages list */}
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
            padding: 10,
            background: '#f5faf8',
            overflowY: 'auto',
            marginBottom: 8,
          }}
        >
          {loading ? (
            <p
              style={{
                fontSize: 12,
                color: BRAND.muted,
                margin: 0,
              }}
            >
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: BRAND.muted,
                margin: 0,
              }}
            >
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom: 6,
                  padding: '4px 6px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid rgba(31,95,99,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1f5f63',
                  }}
                >
                  {/* For now we show a generic label; later you can map sender_user_id to a name */}
                  Participant
                  <span
                    style={{
                      fontWeight: 400,
                      color: '#8aa19f',
                      marginLeft: 6,
                    }}
                  >
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: BRAND.text,
                    marginTop: 2,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 12,
              color: '#b00020',
            }}
          >
            {error}
          </p>
        )}

        {/* Input */}
        <form onSubmit={handleSend}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Write a message...'
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 999,
                border: `1px solid ${BRAND.border}`,
                fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor:
                  sending || !input.trim() ? 'default' : 'pointer',
                background: BRAND.brandGradient,
                color: '#ffffff',
                boxShadow: BRAND.softShadow,
                opacity: sending || !input.trim() ? 0.75 : 1,
              }}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityChatModal;