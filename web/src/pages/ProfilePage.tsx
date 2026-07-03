// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wellsync-logo.png';

const backendUrl = process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:4000';

interface ProfileResponse {
  hasProfile: boolean;
  profile: Profile | null;
}

interface Profile {
  username: string | null;
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  step_goal_per_day: number;
  high_hr_threshold: number | null;
  low_spo2_threshold: number | null;
  poor_air_quality_threshold: number | null;
  // NEW: emergency contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'athlete';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary',         label: 'Sedentary' },
  { value: 'lightly_active',    label: 'Lightly active' },
  { value: 'moderately_active', label: 'Moderately active' },
  { value: 'very_active',       label: 'Very active' },
  { value: 'athlete',           label: 'Athlete' },
];

/* ─────────── Design tokens ─────────── */
const BRAND = {
  deep:    '#1f5f63',
  mid:     '#2f8a8f',
  light:   '#7cc2b5',
  bg:      'linear-gradient(160deg, #eef7f5 0%, #d6ebe6 100%)',
  cardBg:  'rgba(255,255,255,0.88)',
  border:  '#d8e9e6',
  text:    '#16302f',
  muted:   '#5b7c79',
  errorBg: 'rgba(220, 38, 38, 0.08)',
  errorBd: 'rgba(220,38,38,0.25)',
  errorTx: '#9b1c1c',
  okBg:    'rgba(22, 163, 74, 0.08)',
  okBd:    'rgba(22,163,74,0.3)',
  okTx:    '#166534',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${BRAND.border}`,
  fontSize: 14,
  color: BRAND.text,
  background: '#ffffff',
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s, background .2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: BRAND.text,
  letterSpacing: '0.02em',
};

const cardBase: React.CSSProperties = {
  background: BRAND.cardBg,
  borderRadius: 18,
  border: `1px solid ${BRAND.border}`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 16px 40px -20px rgba(31,95,99,0.35), 0 2px 8px rgba(31,95,99,0.08)',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const json = (await res.json()) as ProfileResponse;

      if (!json.hasProfile || !json.profile) {
        setProfile({
          username: null,
          full_name: null,
          age: null,
          height_cm: null,
          weight_kg: null,
          activity_level: null,
          step_goal_per_day: 10000,
          high_hr_threshold: null,
          low_spo2_threshold: null,
          poor_air_quality_threshold: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
        });
      } else {
        // Ensure emergency fields exist
        setProfile({
          ...json.profile,
          emergency_contact_name:
            json.profile.emergency_contact_name ?? null,
          emergency_contact_phone:
            json.profile.emergency_contact_phone ?? null,
        });
      }
    } catch (err: any) {
      setError(err.message ?? 'Error loading profile');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange<K extends keyof Profile>(
    field: K,
    value: Profile[K]
  ) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const body = {
        username: profile.username,
        full_name: profile.full_name,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity_level: profile.activity_level,
        step_goal_per_day: profile.step_goal_per_day,
        // NEW: emergency contact
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
      };

      const res = await fetch(`${backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error ?? 'Failed to save profile';
        throw new Error(msg);
      }

      const json = (await res.json()) as { profile: Profile };
      setProfile(json.profile);
      setSuccess('Profile updated');
    } catch (err: any) {
      setError(err.message ?? 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    navigate('/dashboard');
  }

  const Alert = ({
    type,
    children,
  }: {
    type: 'error' | 'success';
    children: React.ReactNode;
  }) => (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 12px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        background: type === 'error' ? BRAND.errorBg : BRAND.okBg,
        border: `1px solid ${type === 'error' ? BRAND.errorBd : BRAND.okBd}`,
        color: type === 'error' ? BRAND.errorTx : BRAND.okTx,
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: BRAND.text,
        letterSpacing: '-0.2px',
      }}
    >
      {children}
    </h2>
  );

  const SectionSub = ({ children }: { children: React.ReactNode }) => (
    <p
      style={{
        margin: '4px 0 0',
        fontSize: 13,
        color: BRAND.muted,
      }}
    >
      {children}
    </p>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px clamp(16px, 4vw, 48px) 40px',
        background: BRAND.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: BRAND.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1f5f63, #7cc2b5)',
          opacity: 0.22,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1f5f63, #7cc2b5)',
          opacity: 0.16,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <header
        style={{
          ...cardBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 20px',
          marginBottom: 28,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            border: 'none',
            background: '#eaf2f0',
            padding: '8px 16px',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: BRAND.deep,
            transition: 'transform .1s, background .2s, box-shadow .2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>🏠</span>
          Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logo}
            alt="WellSync"
            style={{ height: 32, width: 'auto', background: 'transparent' }}
            draggable={false}
          />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              Profile
            </div>
            <div style={{ fontSize: 11, color: BRAND.muted }}>
              Keep your details in sync
            </div>
          </div>
        </div>

        <div style={{ width: 100 }} />
      </header>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {loading ? (
          <div
            style={{
              ...cardBase,
              padding: 36,
              textAlign: 'center',
              color: BRAND.muted,
              fontSize: 15,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${BRAND.border}`,
                borderTopColor: BRAND.deep,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            Loading profile…
          </div>
        ) : !profile ? (
          <div
            style={{
              ...cardBase,
              padding: 36,
              textAlign: 'center',
              color: BRAND.muted,
              fontSize: 15,
            }}
          >
            No profile data available.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ ...cardBase, padding: 28 }}>
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <SectionTitle>
                <span style={{ marginRight: 8 }}>📋</span>
                Personal details
              </SectionTitle>
              <SectionSub>
                Update your info so WellSync can stay in tune with you.
              </SectionSub>
            </div>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>👤</span>
                Username
              </label>
              <input
                type="text"
                value={profile.username ?? ''}
                onChange={(e) =>
                  handleFieldChange('username', e.target.value || null)
                }
                placeholder="Choose a unique username, e.g. adrian.d"
                style={inputStyle}
              />
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                Friends will find you using this username (for example:
                @adrian.d).
              </p>
            </div>

            {/* Full name */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>📛</span>
                Full name
              </label>
              <input
                type="text"
                value={profile.full_name ?? ''}
                onChange={(e) =>
                  handleFieldChange('full_name', e.target.value || null)
                }
                placeholder="Your full name"
                style={inputStyle}
              />
            </div>

            {/* Age / Height / Weight */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div>
                <label style={labelStyle}>
                  <span style={{ marginRight: 6 }}>🎂</span>
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'age',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Years"
                  min={0}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <span style={{ marginRight: 6 }}>📏</span>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={profile.height_cm ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'height_cm',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g. 170"
                  min={0}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <span style={{ marginRight: 6 }}>⚖️</span>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.weight_kg ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'weight_kg',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g. 65.5"
                  min={0}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Activity level */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>🏃</span>
                Activity level
              </label>
              <select
                value={profile.activity_level ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'activity_level',
                    e.target.value || null
                  )
                }
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b7c79' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: 32,
                }}
              >
                <option value="">Select activity level</option>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Step goal */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>👣</span>
                Daily step goal
              </label>
              <input
                type="number"
                value={profile.step_goal_per_day}
                onChange={(e) =>
                  handleFieldChange(
                    'step_goal_per_day',
                    Number(e.target.value || 0)
                  )
                }
                min={0}
                style={inputStyle}
              />
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                This goal is used on your dashboard and in recommendations.
              </p>
            </div>

            {/* NEW: emergency contact section */}
            <div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${BRAND.border}, transparent)`,
                marginBottom: 18,
              }}
            />

            <div style={{ marginBottom: 12 }}>
              <SectionTitle>
                <span style={{ marginRight: 8 }}>🆘</span>
                Emergency contact
              </SectionTitle>
              <SectionSub>
                This contact is used by the fall detection demo to place
                automated calls.
              </SectionSub>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>📞</span>
                Emergency contact name
              </label>
              <input
                type="text"
                value={profile.emergency_contact_name ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'emergency_contact_name',
                    e.target.value || null
                  )
                }
                placeholder="e.g. Mom"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>
                <span style={{ marginRight: 6 }}>📱</span>
                Emergency contact phone
              </label>
              <input
                type="tel"
                value={profile.emergency_contact_phone ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'emergency_contact_phone',
                    e.target.value || null
                  )
                }
                placeholder="e.g. +40..."
                style={inputStyle}
              />
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: BRAND.muted,
                }}
              >
                Make sure to include the country code for international calls.
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${BRAND.border}, transparent)`,
                marginBottom: 22,
              }}
            />

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'opacity .2s, transform .1s, box-shadow .2s',
                  boxShadow: '0 2px 8px rgba(31,95,99,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <span style={{ fontSize: 16 }}>⏳</span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16 }}>💾</span>
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
