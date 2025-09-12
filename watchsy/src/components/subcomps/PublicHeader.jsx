import React from 'react';

export default function PublicHeader() {
  return (
    <header style={{ padding: '10px 0', background: '#181c24', position: 'sticky', top: 0, zIndex: 10 }}>
      <div className="container d-flex flex-row align-items-center justify-content-center" style={{ minHeight: '80px', padding: '0 1rem' }}>
        <a href="/" tabIndex={0} role="logo" aria-label="Watchsy home">
          <svg
            width="220"
            height="70"
            viewBox="0 8 300 80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="filmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#6a11cb', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2575fc', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#6a11cb', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ff6b6b', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ffd93d', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="20" y="25" width="50" height="45" rx="8" ry="8" fill="url(#filmGradient)" />
            {[34, 42, 50, 58].map((cy, i) => (
              <g key={cy}>
                <circle cx="26" cy={cy} r="3" fill="rgba(0,0,0,0.3)" />
                <circle cx="64" cy={cy} r="3" fill="rgba(0,0,0,0.3)" />
              </g>
            ))}
            <g transform="translate(50, 5) scale(1.2)">
              <path d="M15 15 C15 10, 10 5, 5 10 C0 15, 7 25, 15 30 C23 25, 30 15, 25 10 C20 5, 15 10, 15 15 Z" fill="#ff4757" />
              <polygon points="15,13 16.5,17 20,17 17,19.5 18.5,23 15,21 11.5,23 13,19.5 10,17 13.5,17" fill="white" />
            </g>
            <text x="80" y="62" fill="url(#textGradient)" fontFamily="Orbitron, Arial, sans-serif" fontSize="42" fontWeight="900" className="logo-text">
              Watchsy
            </text>
          </svg>
        </a>
      </div>
    </header>
  );
} 