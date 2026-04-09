import React, { useEffect, useRef } from 'react';
import { DARK_THEME } from '@/constants/theme';

function StatusDistribution({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 200;
    const center = size / 2;
    const outerRadius = 88;
    const innerRadius = 56;

    ctx.clearRect(0, 0, size, size);

    // Guard against division by zero when total is 0
    if (total === 0) {
      ctx.fillStyle = DARK_THEME.text;
      ctx.font = '700 30px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', center, center - 6);
      ctx.fillStyle = DARK_THEME.textMuted;
      ctx.font = '400 10px JetBrains Mono';
      ctx.fillText('TOTAL', center, center + 14);
      return;
    }

    let startAngle = -Math.PI / 2;

    data.forEach((item) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(center, center, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(center, center, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      startAngle += sliceAngle;
    });

    ctx.fillStyle = DARK_THEME.text;
    ctx.font = '700 30px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), center, center - 6);

    ctx.fillStyle = DARK_THEME.textMuted;
    ctx.font = '400 10px JetBrains Mono';
    ctx.fillText('TOTAL', center, center + 14);
  }, [data, total]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <canvas ref={canvasRef} width={200} height={200} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60`, flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: DARK_THEME.textMuted, flex: 1 }}>
                {item.status}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600, color: item.color, minWidth: '28px', textAlign: 'right' }}>
                {item.count}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: DARK_THEME.textMuted,
                padding: '2px 8px', backgroundColor: `${item.color}10`, borderRadius: '4px', minWidth: '36px', textAlign: 'center',
              }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusDistribution;
