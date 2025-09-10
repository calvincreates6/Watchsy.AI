import React, { useMemo, useRef, useState } from 'react';

const GENRE_ID_TO_NAME = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const PALETTE = [
  '#ffcc00', '#00c2ff', '#ff6b6b', '#7bed9f', '#a29bfe', '#ffa502', '#70a1ff',
  '#eccc68', '#1e90ff', '#ff4757', '#3742fa', '#2f3542'
];

function getPrimaryGenreName(movie) {
  if (!movie) return 'Others';
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    const first = movie.genres[0];
    if (typeof first === 'string') return first || 'Others';
    if (first && typeof first.name === 'string') return first.name || 'Others';
  }
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    const name = GENRE_ID_TO_NAME[movie.genre_ids[0]];
    return name || 'Others';
  }
  if (typeof movie.genre === 'string' && movie.genre) return movie.genre;
  return 'Others';
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function darken(hex, ratio = 0.7) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.floor(r * ratio));
  const ng = Math.max(0, Math.floor(g * ratio));
  const nb = Math.max(0, Math.floor(b * ratio));
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function polarToCartesian(r, angle) {
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

function buildTopSlicePath(r, start, end) {
  const startP = polarToCartesian(r, start);
  const endP = polarToCartesian(r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M 0 0 L ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y} Z`;
}

function buildSidePath(r, start, end, depth) {
  const startP = polarToCartesian(r, start);
  const endP = polarToCartesian(r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  const d = depth;
  // Connect top arc to bottom arc offset by +d in Y to simulate thickness
  return `M ${startP.x} ${startP.y}
          A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y}
          L ${endP.x} ${endP.y + d}
          A ${r} ${r} 0 ${largeArc} 0 ${startP.x} ${startP.y + d}
          Z`;
}

export default function GenrePieChart({ movies = [], size = 320, minPercentForOthers = 1 }) {
  const containerRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [tooltip, setTooltip] = useState(null);

  const data = useMemo(() => {
    if (!Array.isArray(movies) || movies.length === 0) return { total: 0, segments: [] };

    const counts = new Map();
    for (const movie of movies) {
      const name = getPrimaryGenreName(movie);
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return { total: 0, segments: [] };

    const raw = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
    raw.sort((a, b) => b.count - a.count);

    let others = 0;
    const segments = [];
    for (const seg of raw) {
      const percent = (seg.count / total) * 100;
      if (percent < minPercentForOthers) others += seg.count; else segments.push({ ...seg, percent });
    }
    if (others > 0) segments.push({ name: 'Others', count: others, percent: (others / total) * 100 });
    return { total, segments };
  }, [movies, minPercentForOthers]);

  if (data.total === 0) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>Genre Breakdown</div>
        <div style={{ padding: '16px', color: '#a0a4ae' }}>No watched movies yet.</div>
      </div>
    );
  }

  const r = Math.min(size, 420) / 2 - 16;
  const depth = 30;
  const cx = size / 2;
  const cy = size / 2 - 6; // lift a bit so depth fits

  // Angles start at -90deg (top) and go clockwise
  const totalAngle = Math.PI * 2;
  let start = -Math.PI / 2;

  const legendItems = data.segments.map((seg, idx) => ({
    ...seg,
    color: seg.name === 'Others' ? '#57606f' : PALETTE[idx % PALETTE.length]
  }));

  return (
    <div style={styles.card} ref={containerRef}>
      <div style={styles.header}>Watched Movies Genre Breakdown</div>
      <div style={styles.content}>
        <svg width={size} height={size + depth} role="img" aria-label="Genre distribution">
          <g transform={`translate(${cx}, ${cy})`}>
            {/* Sides (rendered first) */}
            {legendItems.map((seg, idx) => {
              const angle = totalAngle * (seg.count / data.total);
              const end = start + angle;
              const exploded = hoverIdx === idx ? 8 : 0;
              const mid = (start + end) / 2;
              const offX = Math.cos(mid) * exploded;
              const offY = Math.sin(mid) * exploded;
              const path = buildSidePath(r, start, end, depth);
              const dColor = darken(seg.color, 0.65);
              const res = (
                <path
                  key={`side-${idx}`}
                  d={path}
                  transform={`translate(${offX}, ${offY})`}
                  fill={dColor}
                />
              );
              start = end;
              return res;
            })}
          </g>

          {/* Reset angle for top faces pass */}
          <g transform={`translate(${cx}, ${cy})`}>
            {(() => { start = -Math.PI / 2; return null; })()}
            {legendItems.map((seg, idx) => {
              const angle = totalAngle * (seg.count / data.total);
              const end = start + angle;
              const exploded = hoverIdx === idx ? 8 : 0;
              const mid = (start + end) / 2;
              const offX = Math.cos(mid) * exploded;
              const offY = Math.sin(mid) * exploded;
              const topPath = buildTopSlicePath(r, start, end);
              const res = (
                <g key={`slice-${idx}`} 
                   onMouseEnter={() => setHoverIdx(idx)}
                   onMouseLeave={() => { setHoverIdx(-1); setTooltip(null); }}
                   onMouseMove={(e) => {
                     const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const y = e.clientY - rect.top;
                     setTooltip({ x, y, seg });
                   }}
                   style={{ cursor: 'pointer' }}
                >
                  <path d={topPath} transform={`translate(${offX}, ${offY})`} fill={seg.color} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                  {/* glossy highlight */}
                  <path d={topPath} transform={`translate(${offX}, ${offY})`} fill="url(#gloss)" opacity="0.25" />
                </g>
              );
              start = end;
              return res;
            })}

            {/* Center donut */}
            <circle r={r - 40} fill="#0f1320" transform="translate(0,0)" />
            <text x="0" y="-3" fill="#eaeaea" fontSize="20" fontWeight="700" textAnchor="middle">{data.total}</text>
            <text x="0" y="16" fill="#a5acb8" fontSize="11" textAnchor="middle">movies</text>
          </g>

          <defs>
            <radialGradient id="gloss" cx="30%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        <div style={styles.legend}>
          {legendItems.map((seg, i) => (
            <div key={seg.name} style={{ ...styles.legendRow, opacity: hoverIdx === -1 || hoverIdx === i ? 1 : 0.55 }}>
              <span style={{ ...styles.swatch, background: seg.color }} />
              <div style={styles.legendText}>
                <div style={styles.legendName}>{seg.name}</div>
                <div style={styles.legendMeta}>{seg.count} • {seg.percent.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div style={{
          position: 'absolute',
          transform: `translate(${tooltip.x + 12}px, ${tooltip.y + 12}px)`,
          background: 'rgba(15,19,32,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#eaeaea',
          borderRadius: '8px',
          padding: '6px 8px',
          pointerEvents: 'none',
          fontSize: '12px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.35)'
        }}>
          <div style={{ fontWeight: 700 }}>{tooltip.seg.name}</div>
          <div style={{ opacity: 0.85 }}>{tooltip.seg.count} • {tooltip.seg.percent.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    overflow: 'hidden'
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'linear-gradient(90deg, rgba(255,0,136,0.12) 0%, rgba(0,179,255,0.12) 100%)',
    color: '#eaeaea',
    fontWeight: 700
  },
  content: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  legend: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px'
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  swatch: {
    width: '12px',
    height: '12px',
    borderRadius: '3px'
  },
  legendText: {
    display: 'flex',
    flexDirection: 'column'
  },
  legendName: {
    color: '#eaeaea',
    fontWeight: 600,
    fontSize: '14px'
  },
  legendMeta: {
    color: '#a0a4ae',
    fontSize: '12px'
  }
}; 