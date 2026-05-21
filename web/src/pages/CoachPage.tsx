// src/CoachPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';
import coachImg from '../assets/wellsync_coach.png';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

interface CoachMessage {
  id: string;
  from: 'user' | 'coach' | 'system';
  text: string;
}

const CoachPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const topic = searchParams.get('topic'); // "progress", "nutrition", "health_tips" or null

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // guard so the topic auto-call runs only once per topic
  const hasAskedForTopic = useRef(false);

  // Map topic → initial question for the coach
  function getInitialQuestionForTopic(topic: string): string {
    if (topic === 'progress') {
      return 'Can you give me a short summary of my recent progress and what I should focus on next?';
    }
    if (topic === 'nutrition') {
      return 'Based on my recent activity, what simple nutrition tips would you recommend for today?';
    }
    if (topic === 'health_tips') {
      return 'Can you share a couple of practical health tips for me today based on my recent data?';
    }
    return 'How can you help me today?';
  }

  // Load initial state depending on topic
  useEffect(() => {
    // reset guard whenever topic changes
    hasAskedForTopic.current = false;

    const baseMessages: CoachMessage[] = [
      {
        id: 'greeting',
        from: 'coach',
        text: 'Hi, I’m your WellSync Coach. How can I help you today?',
      },
    ];

    if (topic) {
      const initialQuestion = getInitialQuestionForTopic(topic);

      // Show the predefined question from the user in the chat
      baseMessages.push({
        id: 'topic-question',
        from: 'user',
        text: initialQuestion,
      });

      setMessages(baseMessages);

      // Ask the coach once for this topic
      if (!hasAskedForTopic.current) {
        hasAskedForTopic.current = true;
        handleAsk(initialQuestion, { fromTopic: true });
      }
    } else {
      setMessages(baseMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  async function handleAsk(
    questionText?: string,
    options?: { fromTopic?: boolean }
  ) {
    const textToSend = questionText ?? input.trim();
    if (!textToSend) return;

    setError(null);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setError('You must be logged in to talk to the coach.');
        setLoading(false);
        return;
      }

      // Append the user message only when the user actually typed it
      if (!options?.fromTopic) {
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            from: 'user',
            text: textToSend,
          },
        ]);
      }

      const body: any = {
        userId: session.user.id,
        question: textToSend,
      };

      const response = await fetch(`${backendUrl}/api/coach/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setError('The coach could not answer right now. Please try again.');
        setLoading(false);
        return;
      }

      const data: { summary: string; actionSteps: string[] } =
        await response.json();

      const coachText =
        data.actionSteps && data.actionSteps.length > 0
          ? data.summary +
            '\n\n' +
            data.actionSteps.map((s) => `• ${s}`).join('\n')
          : data.summary;

      setMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          from: 'coach',
          text: coachText,
        },
      ]);

      if (!options?.fromTopic) {
        setInput('');
      }
    } catch (err) {
      console.error('Error calling AI coach:', err);
      setError('Unexpected error talking to the coach.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #eef7f5 0%, #d6ebe6 100%)',
        padding: '16px 0 24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#1f3b3a',
      }}
    >
      {/* Top bar similar to dashboard */}
      <header
        style={{
          maxWidth: 780,
          margin: '0 auto 16px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 14,
            color: '#5d7b79',
          }}
        >
          ← Back to dashboard
        </button>
        <img
          src={logo}
          alt="WellSync"
          style={{ height: 36, width: 'auto' }}
        />
        <div style={{ width: 90 }} />
      </header>

      {/* Chat card */}
      <main
        style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <section
          style={{
            borderRadius: 24,
            border: '1px solid #d8e9e6',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 20px 60px -20px rgba(31, 95, 99, 0.35)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            height: '70vh',
            maxHeight: 640,
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 22,
              fontWeight: 600,
              color: '#1f3b3a',
            }}
          >
            WellSync Coach
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: '#5d7b79',
            }}
          >
            Ask questions about your progress, activity, and health habits. Your
            data is used to tailor the advice.
          </p>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 6px',
              borderRadius: 16,
              background: '#f4faf8',
            }}
          >
            {messages.map((m) => {
              const isUser = m.from === 'user';
              const showAvatar = m.from === 'coach';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  {/* Left side for coach avatar */}
                  {!isUser && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      {showAvatar && (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#e4f3f0',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            marginRight: 6,
                          }}
                        >
                          <img
                            src={coachImg}
                            alt="Coach avatar"
                            style={{
                              width: 20,
                              height: 20,
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: 14,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 14,
                          background: '#ffffff',
                          color: '#1f3b3a',
                          fontSize: 13,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  )}

                  {/* Right side for user bubble */}
                  {isUser && (
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '8px 12px',
                        borderRadius: 14,
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 4,
                        background:
                          'linear-gradient(135deg, #1f5f63, #7cc2b5)',
                        color: '#ffffff',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div
                style={{ fontSize: 12, color: '#5d7b79', marginTop: 4 }}
              >
                Coach is thinking…
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: '#b00020',
              }}
            >
              {error}
            </div>
          )}

          {/* Composer */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                topic
                  ? 'Ask a follow-up question…'
                  : 'Ask anything like “What should I focus on today?”'
              }
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                borderRadius: 14,
                border: '1px solid #d8e9e6',
                padding: 10,
                fontSize: 13,
                resize: 'vertical',
                fontFamily: 'inherit',
                color: '#1f3b3a',
              }}
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #1f5f63, #7cc2b5)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                opacity: loading || !input.trim() ? 0.7 : 1,
                boxShadow: '0 8px 20px rgba(31,95,99,0.35)',
              }}
            >
              {loading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CoachPage;