// src/components/WellSyncCoachWidget.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import coachImg from '../assets/wellsync_coach.png'; // transparent PNG

const WellSyncCoachWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showBubble, setShowBubble] = useState(true); // controls the text bubble

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.coach-widget-root')) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  function handleToggle() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);

    // Hide the bubble once user opens the menu for the first time
    if (!isOpen && showBubble) {
      setShowBubble(false);
    }
  }

  function handleGoCoach(topic: string) {
    navigate(`/coach?topic=${encodeURIComponent(topic)}`);
  }

  function handleStartFullSession() {
    navigate('/coach');
  }

  return (
    <div
      className="coach-widget-root"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.75rem',
      }}
    >
      {/* Popup */}
      <div
        style={{
          width: 300,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 18,
          border: '1px solid #d8e9e6',
          boxShadow: '0 20px 40px rgba(0,0,0,0.16)',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(12px)',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease-out, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
            padding: '0.9rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.16)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={coachImg}
              alt="WellSync Coach"
              style={{ width: 42, height: 42, objectFit: 'contain' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fdfdfd',
                lineHeight: 1.2,
              }}
            >
              WellSync Coach
            </div>
            <div
              style={{
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: '#6dff9a',
                }}
              />
              Online · AI-powered
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(0,0,0,0.14)',
              display: 'grid',
              placeItems: 'center',
              color: '#fdfdfd',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1rem 1.1rem 1.1rem',
            background: 'rgba(255,255,255,0.98)',
          }}
        >
          {/* Bot bubble */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: '#e4f3f0',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={coachImg}
                alt=""
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                background: '#f7fbfa',
                borderRadius: 14,
                borderTopLeftRadius: 6,
                border: '1px solid rgba(0,0,0,0.04)',
                padding: '0.6rem 0.8rem',
                fontSize: 13,
                color: '#1f3b3a',
                lineHeight: 1.5,
              }}
            >
              Hi, I’m your WellSync Coach. Let’s review today and plan your next steps.
            </div>
          </div>

          {/* Chips / mini buttons */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={() => handleGoCoach('progress')}
              style={chipStyle}
            >
              My progress
            </button>
            <button
              type="button"
              onClick={() => handleGoCoach('nutrition')}
              style={chipStyle}
            >
              Nutrition
            </button>
            <button
              type="button"
              onClick={() => handleGoCoach('health_tips')}
              style={chipStyle}
            >
              Health tips
            </button>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleStartFullSession}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '0.55rem 0.9rem',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #1f5f63 0%, #7cc2b5 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            Start a full coach session
            <span style={{ fontSize: 14 }}>➜</span>
          </button>
        </div>
      </div>

      {/* Bot button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close WellSync Coach' : 'Open WellSync Coach'}
        style={{
          position: 'relative',
          width: 120,
          height: 120,
          borderRadius: '999px',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background:
            'radial-gradient(circle at 30% 0%, #ffffff 0%, #e1f3f0 40%, #c6e7e1 100%)',
          boxShadow: '0 14px 28px rgba(0,0,0,0.35)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          transform: isOpen
            ? 'translate(-8px, -10px) scale(1.05)'
            : isClicked
            ? 'translate(-4px, -6px) scale(0.96)'
            : 'translateY(0)',
          animation: isOpen
            ? 'none'
            : 'wellsync-bot-float 3s ease-in-out infinite',
          transition:
            'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
        }}
      >
        <style>
          {`
          @keyframes wellsync-bot-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
        </style>

        <img
          src={coachImg}
          alt="WellSync AI Coach"
          style={{
            width: 100,
            height: 100,
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* Speech bubble: separate from button so it is not clipped */}
      {showBubble && !isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 140, // above the circle
            right: 0, // aligned with the circle
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #d8e9e6',
            padding: '8px 12px',
            fontSize: 13,
            color: '#1f3b3a',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: 260,
            textAlign: 'left',
          }}
        >
          Hi, I’m WellSync Coach. Tap me for more info.
        </div>
      )}
    </div>
  );
};

const chipStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid #d8e9e6',
  background: '#f9fbfa',
  fontSize: 12,
  color: '#5d7b79',
  cursor: 'pointer',
};

export default WellSyncCoachWidget;