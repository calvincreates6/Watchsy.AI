import React, { useMemo, useState } from 'react';

export default function Heatmap({ events = [], title = 'Watch Activity' }){
  // events: array of { date: Date, count: number, items?: any[] }
  const [hover, setHover] = useState(null);

  const { weeks, maxCount } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7 * 53); // ~53 weeks

    const dayKey = (d) => d.toISOString().slice(0,10);
    const counts = new Map();
    const itemsMap = new Map();
    for (const e of events) {
      const key = dayKey(e.date);
      counts.set(key, (counts.get(key) || 0) + (e.count || 1));
      if (e.items) itemsMap.set(key, e.items);
    }
    let max = 0;
    counts.forEach((v) => { if (v > max) max = v; });

    const weeksArr = [];
    const cursor = new Date(start);
    // align to week start (Sun)
    while (cursor.getDay() !== 0) cursor.setDate(cursor.getDate() - 1);
    for (let w = 0; w < 54; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const key = dayKey(cursor);
        const count = counts.get(key) || 0;
        days.push({ date: new Date(cursor), key, count, items: itemsMap.get(key) });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeksArr.push(days);
      if (cursor > today) break;
    }
    return { weeks: weeksArr, maxCount: max || 1 };
  }, [events]);

  const colorFor = (c) => {
    if (!c) return 'rgba(255,255,255,0.06)';
    const t = Math.min(1, c / maxCount);
    // yellow-orange theme
    const from = [255, 217, 61]; // #ffd93d
    const to = [255, 107, 107];  // #ff6b6b
    const mix = (i) => Math.round(from[i] + (to[i] - from[i]) * t);
    return `rgba(${mix(0)}, ${mix(1)}, ${mix(2)}, ${0.9 * t + 0.2})`;
  };

  return (
    <div>
      <h3 className="content-title" style={{ margin: '0 0 12px 0' }}>{title}</h3>
      <div style={{ display:'flex', gap:4, alignItems:'flex-start', overflowX:'auto', paddingBottom:8 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:'grid', gridTemplateRows:'repeat(7, 1fr)', gap:4 }}>
            {week.map((day, di) => (
              <div
                key={day.key + di}
                title={`${day.date.toDateString()} • ${day.count} watched`}
                onMouseEnter={() => setHover(day)}
                onMouseLeave={() => setHover(null)}
                style={{ width:17.5, height:17.5, borderRadius:3, background: colorFor(day.count), border:'1px solid rgba(255,255,255,0.08)' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 