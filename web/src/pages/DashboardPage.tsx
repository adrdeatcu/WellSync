// src/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';
import WellSyncCoachWidget from '../components/WellSyncCoachWidget';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

interface TodayStatsResponse {
  hasData: boolean;
  stats: {
    total_steps: number;
    avg_heart_rate_bpm: number | null;
    min_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
    avg_air_quality_index: number | null;
    avg_temperature_c: number | null;
    avg_humidity_percent: number | null;
    avg_pressure_hpa: number | null;
  } | null;
}

interface GoalsResponse {
  hasProfile: boolean;
  goals: {
    step_goal_per_day: number;
    high_hr_threshold: number | null;
    low_spo2_threshold: number | null;
    poor_air_quality_threshold: number | null;
  } | null;
}

type PanelSection = 'history' | 'profile';

interface FriendUser {
  id: string;
  username: string | null;
  full_name: string | null;
}

interface FriendsOverviewResponse {
  friends: FriendUser[];
  incoming_requests: FriendUser[];
  outgoing_requests: FriendUser[];
}

interface FriendsSearchResponse {
  results: FriendUser[];
}

// Shared brand tokens (mirrors LoginPage)
const BRAND = {
  bg: 'linear-gradient(160deg, #eef7f5 0%, #d6ebe6 100%)',
  brandGradient: 'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
  cardShadow: '0 20px 60px -20px rgba(31, 95, 99, 0.35)',
  softShadow: '0 4px 20px -4px rgba(31, 95, 99, 0.15)',
  primary: '#1f5f63',
  accent: '#7cc2b5',
  text: '#1f3b3a',
  muted: '#5d7b79',
  border: '#d8e9e6',
  cardBg: 'rgba(255,255,255,0.85)',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Loading...');
  const [todayStats, setTodayStats] = useState<TodayStatsResponse | null>(null);
  const [goals, setGoals] = useState<GoalsResponse | null>(null);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [panelSection, setPanelSection] = useState<PanelSection>('history');

  // AI coach state
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachSummary, setCoachSummary] = useState<string | null>(null);
  const [coachSteps, setCoachSteps] = useState<string[]>([]);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachQuestion, setCoachQuestion] = useState('');

  // Friends state
  const [friendsData, setFriendsData] = useState<FriendsOverviewResponse | null>(
    null
  );
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [friendsListOpen, setFriendsListOpen] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      setStatus('Loading stats...');

      const statsRes = await fetch(`${backendUrl}/api/stats/today`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!statsRes.ok) {
        setStatus('Error loading stats');
        return;
      }

      const statsJson: TodayStatsResponse = await statsRes.json();
      setTodayStats(statsJson);

      const goalsRes = await fetch(`${backendUrl}/api/goals`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (goalsRes.ok) {
        const goalsJson: GoalsResponse = await goalsRes.json();
        setGoals(goalsJson);
      }

      setStatus('Loaded');
    }

    load();
  }, [navigate]);

  // Load friends overview when panel opens
  useEffect(() => {
    if (!showUserPanel) return;
    void reloadFriends();
  }, [showUserPanel]);

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not logged in');
    return session.access_token;
  }

  async function reloadFriends() {
    try {
      setFriendsLoading(true);
      setFriendsError(null);
      const token = await getSessionToken();

      const res = await fetch(`${backendUrl}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load friends');
      }

      const json = (await res.json()) as FriendsOverviewResponse;
      setFriendsData(json);
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setFriendsError(err.message ?? 'Error loading friends');
    } finally {
      setFriendsLoading(false);
    }
  }

  async function handleSearchFriends(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setSearchLoading(true);
      setSearchError(null);
      const token = await getSessionToken();

      const res = await fetch(`${backendUrl}/api/friends/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Search failed';
        throw new Error(msg);
      }

      const json = (await res.json()) as FriendsSearchResponse;
      setSearchResults(json.results);
    } catch (err: any) {
      console.error('Error searching friends:', err);
      setSearchError(err.message ?? 'Error searching users');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSendFriendRequest(targetUserId: string) {
    try {
      const token = await getSessionToken();

      const res = await fetch(`${backendUrl}/api/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Could not send request';
        throw new Error(msg);
      }

      // Refresh overview so outgoing_requests updates
      await reloadFriends();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setFriendsError(err.message ?? 'Error sending friend request');
    }
  }

  async function handleAcceptFriend(otherUserId: string) {
    try {
      const token = await getSessionToken();

      const res = await fetch(`${backendUrl}/api/friends/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ other_user_id: otherUserId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Could not accept request';
        throw new Error(msg);
      }

      await reloadFriends();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setFriendsError(err.message ?? 'Error accepting friend request');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  async function handleAskCoach() {
    setCoachLoading(true);
    setCoachError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setCoachError('You must be logged in to use the coach.');
        setCoachLoading(false);
        return;
      }

      const body: any = {
        userId: session.user.id,
      };

      if (coachQuestion.trim().length > 0) {
        body.question = coachQuestion.trim();
      }

      const response = await fetch(`${backendUrl}/api/coach/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setCoachError('Failed to get advice from the coach.');
        setCoachLoading(false);
        return;
      }

      const data: { summary: string; actionSteps: string[] } =
        await response.json();

      setCoachSummary(data.summary);
      setCoachSteps(data.actionSteps);
    } catch (err) {
      console.error('Error calling AI coach:', err);
      setCoachError('Unexpected error contacting the coach.');
    } finally {
      setCoachLoading(false);
    }
  }

  const steps =
    todayStats && todayStats.hasData && todayStats.stats?.total_steps
      ? todayStats.stats.total_steps
      : 0;

  const stepGoal =
    goals && goals.hasProfile && goals.goals?.step_goal_per_day
      ? goals.goals.step_goal_per_day
      : 10000;

  const progress = stepGoal > 0 ? Math.min(steps / stepGoal, 1) : 0;

  let progressMessage =
    'No data for today yet. Once measurements arrive, your progress will appear here.';
  if (steps > 0) {
    const pct = progress * 100;
    if (pct < 30)
      progressMessage =
        'You are just getting started. A short walk will boost your progress.';
    else if (pct < 80)
      progressMessage =
        'Nice pace! One more walk will put you close to your goal.';
    else if (pct < 100)
      progressMessage =
        'You are almost there. A little more effort to reach your goal.';
    else progressMessage = 'Goal achieved! Great job today.';
  }

  const stats = todayStats?.stats;

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
      {/* Decorative blobs (same as login) */}
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
          height: 72,
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="WellSync"
            style={{
              height: 44,
              width: 'auto',
              display: 'block',
              background: 'transparent',
            }}
            draggable={false}
          />
        </div>

        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 13,
            fontStyle: 'italic',
            letterSpacing: '0.04em',
            color: BRAND.muted,
          }}
        >
          Your health in sync
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* NEW: Community nav button */}
              <button
                type="button"
                onClick={() => navigate('/community')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${BRAND.border}`,
                  background: '#ffffff',
                  color: BRAND.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Community
              </button>

    <span style={{ fontSize: 12, color: '#94a8a5' }}>{status}</span>
    <button
      type="button"
      onClick={() => setShowUserPanel(true)}
      aria-label="Open account panel"
      /* existing styles and handlers */
    >
      {/* avatar */}
    </button>
  </div>
          <span style={{ fontSize: 12, color: '#94a8a5' }}>{status}</span>
          <button
            type="button"
            onClick={() => setShowUserPanel(true)}
            aria-label="Open account panel"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: 'none',
              background: BRAND.brandGradient,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: BRAND.softShadow,
              position: 'relative',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = 'scale(0.96)')
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = 'scale(1)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'scale(1)')
            }
          >
            <span
              style={{
                position: 'absolute',
                top: 9,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 22,
                height: 11,
                borderRadius: 999,
                background: '#fff',
              }}
            />
          </button>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 780,
          margin: '40px auto',
          padding: '0 20px',
        }}
      >
        {/* Hero card */}
        <section
          style={{
            padding: 32,
            borderRadius: 24,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.cardBg,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: BRAND.cardShadow,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: BRAND.text,
            }}
          >
            Welcome back
          </h2>
          <p style={{ margin: '6px 0 24px', color: BRAND.muted, fontSize: 14 }}>
            Steps progress for today
          </p>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1,
                background: BRAND.brandGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {steps.toLocaleString()}
            </span>
            <span style={{ fontSize: 16, color: BRAND.muted }}>steps</span>
          </div>
          <p style={{ margin: '6px 0 0', color: BRAND.muted, fontSize: 14 }}>
            of {stepGoal.toLocaleString()} goal
          </p>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 18,
              width: '100%',
              height: 12,
              borderRadius: 999,
              background: '#eaf2f0',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(31,95,99,0.08)',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: BRAND.brandGradient,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <p style={{ marginTop: 14, color: '#4a6e6c', fontSize: 14 }}>
            {progressMessage}
          </p>

          {/* Stat tiles */}
          {todayStats && todayStats.hasData && stats && (
            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              <StatTile
                label="Avg Heart Rate"
                value={stats.avg_heart_rate_bpm ?? '—'}
                unit="bpm"
              />
              <StatTile
                label="Air Quality"
                value={stats.avg_air_quality_index ?? '—'}
                unit="AQI"
              />
              <StatTile
                label="Temperature"
                value={stats.avg_temperature_c ?? '—'}
                unit="°C"
              />
              <StatTile
                label="Humidity"
                value={stats.avg_humidity_percent ?? '—'}
                unit="%"
              />
            </div>
          )}

          {/* AI Coach panel */}
          <div
            style={{
              marginTop: 28,
              padding: 16,
              borderRadius: 18,
              border: `1px dashed ${BRAND.border}`,
              background: 'rgba(255,255,255,0.9)',
              boxShadow: BRAND.softShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: BRAND.text,
                  }}
                >
                  AI coach
                </div>
                <div style={{ fontSize: 12, color: BRAND.muted }}>
                  Get a short tip based on your recent steps and heart rate, or
                  ask a specific question about your activity.
                </div>
              </div>

              <button
                type="button"
                onClick={handleAskCoach}
                disabled={coachLoading}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: BRAND.brandGradient,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: coachLoading ? 'default' : 'pointer',
                  boxShadow: BRAND.softShadow,
                  opacity: coachLoading ? 0.7 : 1,
                }}
              >
                {coachLoading ? 'Thinking…' : 'Ask coach'}
              </button>
            </div>

            <textarea
              placeholder='Optional: ask something like “How many steps do I have today?” or tell the coach how your day feels…'
              value={coachQuestion}
              onChange={(e) => setCoachQuestion(e.target.value)}
              style={{
                marginTop: 6,
                width: '100%',
                minHeight: 60,
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                padding: 10,
                fontSize: 13,
                resize: 'vertical',
                fontFamily: 'inherit',
                color: BRAND.text,
              }}
            />

            {coachError && (
              <div style={{ fontSize: 12, color: '#b00020' }}>{coachError}</div>
            )}

            {coachSummary && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: `1px solid ${BRAND.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: BRAND.text,
                    marginBottom: 6,
                  }}
                >
                  {coachSummary}
                </div>
                {coachSteps.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 13,
                      color: BRAND.text,
                    }}
                  >
                    {coachSteps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Right side panel */}
      {showUserPanel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 40, 42, 0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 50,
          }}
          onClick={() => setShowUserPanel(false)}
        >
          <div
            style={{
              width: 360,
              maxWidth: '85%',
              height: '100%',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '-10px 0 40px rgba(31,95,99,0.2)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: `1px solid ${BRAND.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: BRAND.text,
                }}
              >
                Account
              </h3>
              <button
                type="button"
                onClick={() => setShowUserPanel(false)}
                style={{
                  border: 'none',
                  background: '#eef5f3',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: BRAND.primary,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: 4,
                marginBottom: 16,
                background: '#eef5f3',
                borderRadius: 999,
              }}
            >
              {(['history', 'profile'] as PanelSection[]).map((sec) => {
                const active = panelSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      if (sec === 'history') {
                        setShowUserPanel(false);
                        navigate('/history');
                        return;
                      }
                      if (sec === 'profile') {
                        setShowUserPanel(false);
                        navigate('/profile');
                        return;
                      }
                      setPanelSection(sec);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      background: active
                        ? BRAND.brandGradient
                        : 'transparent',
                      color: active ? '#fff' : BRAND.muted,
                      boxShadow: active ? BRAND.softShadow : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>

            {/* Friends section */}
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
                    transform: friendsListOpen
                      ? 'rotate(90deg)'
                      : 'rotate(0deg)',
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
                  <form onSubmit={handleSearchFriends}>
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
                          searchLoading || !searchQuery.trim()
                            ? 'default'
                            : 'pointer',
                        opacity:
                          searchLoading || !searchQuery.trim() ? 0.7 : 1,
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
                      {searchResults.map((u) => (
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
                          <button
                            type="button"
                            onClick={() =>
                              handleSendFriendRequest(u.id)
                            }
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
                        </div>
                      ))}
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
                          friendsData.incoming_requests.map((u) => (
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
                                  {u.username
                                    ? `@${u.username}`
                                    : 'No username'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAcceptFriend(u.id)}
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
                          friendsData.outgoing_requests.map((u) => (
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
                                  {u.username
                                    ? `@${u.username}`
                                    : 'No username'}
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
                            {friendsData.friends.map((u) => (
                              <div
                                key={u.id}
                                style={{
                                  padding: '3px 0',
                                  borderBottom:
                                    '1px solid rgba(31,95,99,0.06)',
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
                                  {u.username
                                    ? `@${u.username}`
                                    : 'No username'}
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

            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginTop: 20,
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: BRAND.brandGradient,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: BRAND.softShadow,
                transition: 'transform 0.15s ease, opacity 0.15s ease',
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = 'scale(0.99)')
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              Log out
            </button>
          </div>
        </div>
      )}

      {/* WellSync Coach floating widget */}
      {!showUserPanel && <WellSyncCoachWidget />}
    </div>
  );
};

const StatTile: React.FC<{
  label: string;
  value: number | string;
  unit: string;
}> = ({ label, value, unit }) => (
  <div
    style={{
      padding: '14px 16px',
      borderRadius: 14,
      border: '1px solid #e2efec',
      background: '#ffffff',
      boxShadow: '0 2px 8px rgba(31,95,99,0.05)',
    }}
  >
    <div style={{ fontSize: 12, color: '#7d9492', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 600, color: '#1f3b3a' }}>
      {value}{' '}
      <span
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: '#7d9492',
        }}
      >
        {unit}
      </span>
    </div>
  </div>
);

export default DashboardPage;