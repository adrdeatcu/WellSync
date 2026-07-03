// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';
import WellSyncCoachWidget from '../components/WellSyncCoachWidget';
import FriendsPanel from '../components/FriendsPanel';
import type {
  FriendUser,
  FriendsOverviewResponse,
  ActivityInvitation,
} from '../types/friends';

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

type PanelSection = 'profile';

interface FriendsSearchResponse {
  results: FriendUser[];
}

// Shared brand tokens (mirrors LoginPage)
export const BRAND = {
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
  const [panelSection, setPanelSection] = useState<PanelSection>('profile');

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

  // NEW: activity invitations state
  const [activityInvites, setActivityInvites] = useState<ActivityInvitation[]>(
    []
  );
  const [activityInvitesLoading, setActivityInvitesLoading] = useState(false);
  const [activityInvitesError, setActivityInvitesError] = useState<
    string | null
  >(null);

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

  // Load friends + invitations when panel opens
  useEffect(() => {
    if (!showUserPanel) return;
    void reloadFriends();
    void reloadActivityInvites();
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
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to load friends';
        throw new Error(msg);
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

  // NEW: load activity invitations
  async function reloadActivityInvites() {
    try {
      setActivityInvitesLoading(true);
      setActivityInvitesError(null);
      const token = await getSessionToken();

      const res = await fetch(`${backendUrl}/api/activities/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to load activity invitations';
        throw new Error(msg);
      }

      const json = await res.json();
      const invitations = (json.invitations ?? []) as {
        id: number;
        activity_id: string;
        activity_title: string;
        inviter_user_id: string;
        inviter_name: string | null;
        city: string | null;
        scheduled_for: string;
      }[];

      setActivityInvites(
        invitations.map((inv) => ({
          id: inv.id,
          activity_id: inv.activity_id,
          activity_title: inv.activity_title,
          inviter_user_id: inv.inviter_user_id,
          inviter_name: inv.inviter_name,
          city: inv.city,
          scheduled_for: inv.scheduled_for,
        }))
      );
    } catch (err: any) {
      console.error('Error loading activity invitations:', err);
      setActivityInvitesError(
        err.message ?? 'Error loading activity invitations'
      );
    } finally {
      setActivityInvitesLoading(false);
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

  // NEW: accept / decline activity invitation
  async function handleRespondInvitation(
    invitationId: number,
    decision: 'accept' | 'decline'
  ) {
    try {
      const token = await getSessionToken();

      const res = await fetch(
        `${backendUrl}/api/activities/invitations/${invitationId}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Could not update invitation';
        throw new Error(msg);
      }

      // Reload invitations so the accepted/declined one disappears
      await reloadActivityInvites();
    } catch (err: any) {
      console.error('Error responding to activity invitation:', err);
      setActivityInvitesError(
        err.message ?? 'Error responding to activity invitation'
      );
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

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Refresh stats
  const [refreshing, setRefreshing] = useState(false);
  async function handleRefreshStats() {
    setRefreshing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const statsRes = await fetch(`${backendUrl}/api/stats/today`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (statsRes.ok) {
        const statsJson: TodayStatsResponse = await statsRes.json();
        setTodayStats(statsJson);
      }

      const goalsRes = await fetch(`${backendUrl}/api/goals`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (goalsRes.ok) {
        const goalsJson: GoalsResponse = await goalsRes.json();
        setGoals(goalsJson);
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
    } finally {
      setRefreshing(false);
    }
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
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 13,
            fontStyle: 'italic',
            letterSpacing: '0.04em',
            color: BRAND.muted,
            whiteSpace: 'nowrap',
          }}
        >
          Your health in sync
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* History nav button */}
          <button
            type="button"
            onClick={() => navigate('/history')}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${BRAND.border}`,
              background: '#ffffff',
              color: BRAND.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BRAND.brandGradient;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = BRAND.softShadow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = BRAND.text;
              e.currentTarget.style.borderColor = BRAND.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <span style={{ fontSize: 16 }}>📜</span>
            History
          </button>
          {/* Community nav button */}
          <button
            type="button"
            onClick={() => navigate('/community')}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${BRAND.border}`,
              background: '#ffffff',
              color: BRAND.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BRAND.brandGradient;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = BRAND.softShadow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = BRAND.text;
              e.currentTarget.style.borderColor = BRAND.border;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            <span style={{ fontSize: 16 }}>🌍</span>
            Community
          </button>

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
            transition: 'box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 24px 70px -20px rgba(31, 95, 99, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = BRAND.cardShadow;
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: BRAND.text,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 28 }}>👋</span>
              {getGreeting()}
            </h2>
            <button
              type="button"
              onClick={handleRefreshStats}
              disabled={refreshing}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: refreshing ? 'default' : 'pointer',
                fontSize: 20,
                color: BRAND.muted,
                transition: 'transform 0.3s ease',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                padding: 4,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Refresh stats"
            >
              🔄
            </button>
          </div>
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
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {steps.toLocaleString()}
            </span>
            <span style={{ fontSize: 16, color: BRAND.muted }}>steps</span>
          </div>
          <p style={{ margin: '6px 0 0', color: BRAND.muted, fontSize: 14 }}>
            of {stepGoal.toLocaleString()} goal
          </p>

          {/* Progress bar with hover tooltip */}
          <div
            style={{
              marginTop: 18,
              width: '100%',
              height: 12,
              borderRadius: 999,
              background: '#eaf2f0',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(31,95,99,0.08)',
              position: 'relative',
              cursor: 'pointer',
            }}
            title={`${(progress * 100).toFixed(1)}% complete`}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: BRAND.brandGradient,
                transition: 'width 0.5s ease',
                position: 'relative',
              }}
            >
              {/* Shimmer effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
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
                emoji="❤️"
              />
              <StatTile
                label="Air Quality"
                value={stats.avg_air_quality_index ?? '—'}
                unit="AQI"
                emoji="🌬️"
              />
              <StatTile
                label="Temperature"
                value={stats.avg_temperature_c ?? '—'}
                unit="°C"
                emoji="🌡️"
              />
              <StatTile
                label="Humidity"
                value={stats.avg_humidity_percent ?? '—'}
                unit="%"
                emoji="💧"
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
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = BRAND.accent;
              e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(31, 95, 99, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BRAND.border;
              e.currentTarget.style.boxShadow = BRAND.softShadow;
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🤖</span>
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
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {coachLoading ? (
                  <>
                    <span style={{ fontSize: 14 }}>⏳</span>
                    Thinking…
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 14 }}>💬</span>
                    Ask coach
                  </>
                )}
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
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BRAND.accent;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND.accent}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = BRAND.border;
                e.currentTarget.style.boxShadow = 'none';
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
              {(['profile'] as PanelSection[]).map((sec) => {
                const active = panelSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
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

            {/* Friends section now uses FriendsPanel */}
            <FriendsPanel
              BRAND={{
                border: BRAND.border,
                text: BRAND.text,
                muted: BRAND.muted,
                brandGradient: BRAND.brandGradient,
              }}
              friendsData={friendsData}
              friendsLoading={friendsLoading}
              friendsError={friendsError}
              friendsListOpen={friendsListOpen}
              setFriendsListOpen={setFriendsListOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              searchLoading={searchLoading}
              searchError={searchError}
              onSearchSubmit={handleSearchFriends}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriend={handleAcceptFriend}
              // NEW props for activity invitations
              activityInvites={activityInvites}
              activityInvitesLoading={activityInvitesLoading}
              activityInvitesError={activityInvitesError}
              onRespondInvitation={handleRespondInvitation}
            />

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
  emoji?: string;
}> = ({ label, value, unit, emoji }) => (
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
      {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
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
