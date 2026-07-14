import React from 'react';

interface StatChip {
  label: string;
  value: number | string;
  color?: string;
}

interface ChartData {
  id: string;
  title: string;
  type: 'pie';
  data: { label: string; value: number; color: string }[];
}

interface StatsPanelProps {
  chips: StatChip[];
  charts?: ChartData[];
  loading?: boolean;
}

const PieChart: React.FC<{ data: ChartData['data']; size?: number }> = ({ data, size = 120 }) => {
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const slices = data.map(d => {
    const start = (cumulative / total) * 360;
    cumulative += d.value;
    const end = (cumulative / total) * 360;
    return { ...d, start, end };
  });

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        if (s.value === 0) return null;
        // ── 360° full-circle case: arc start/end are the same point → render a full ring ──
        if (s.end - s.start >= 359.99) {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill={s.color} />
              <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />
            </g>
          );
        }
        const p1 = polarToCartesian(s.start);
        const p2 = polarToCartesian(s.end);
        const large = s.end - s.start > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
        return <path key={i} d={d} fill={s.color} stroke="#fff" strokeWidth={1} />;
      })}
      {slices.every(s => s.end - s.start < 359.99) && <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />}
    </svg>
  );
};

const StatsPanel: React.FC<StatsPanelProps> = ({ chips, charts, loading }) => {
  const hasCharts = charts && charts.length > 0;

  return (
    <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: hasCharts ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {(loading ? chips : chips).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: loading ? '#F7F6F3' : '#fff', border: '1px solid #E8E6E0', borderRadius: 8 }}>
              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color: loading ? '#DDD' : (c.color ?? '#1A1A1A') }}>
                {loading ? '—' : (typeof c.value === 'number' ? c.value : c.value)}
              </span>
              <span style={{ fontSize: 10, color: loading ? '#CCC' : '#AAA', textTransform: 'uppercase', letterSpacing: '.3px' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Charts (right side) */}
        {hasCharts && (
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {charts.map(chart => (
              <div key={chart.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10 }}>
                <PieChart data={chart.data} size={90} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{chart.title}</div>
                  {chart.data.map(d => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#555', marginBottom: 2, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span>{d.label}</span>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 9, color: '#888' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
