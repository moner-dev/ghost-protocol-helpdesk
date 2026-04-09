import React from 'react';
import { motion } from 'framer-motion';
import { DARK_THEME } from '@/constants/theme';

// Custom scrollbar styles
const scrollbarStyles = `
  .dept-load-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .dept-load-scroll::-webkit-scrollbar-track {
    background: rgba(79, 195, 247, 0.05);
    border-radius: 2px;
  }
  .dept-load-scroll::-webkit-scrollbar-thumb {
    background: rgba(79, 195, 247, 0.3);
    border-radius: 2px;
  }
  .dept-load-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 195, 247, 0.5);
  }
`;

function DepartmentLoad({ data }) {
  // Find the maximum count for proportional bar widths
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getBarColor = (count) => {
    if (count === 0) return 'rgba(79, 195, 247, 0.15)';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity >= 0.7) return DARK_THEME.electric;
    if (intensity >= 0.4) return 'rgba(79, 195, 247, 0.7)';
    return 'rgba(79, 195, 247, 0.5)';
  };

  // Show all active departments, sorted by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  if (sortedData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: DARK_THEME.textMuted,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.1em',
      }}>
        NO DEPARTMENTS
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className="dept-load-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          height: '100%',
          overflowY: 'auto',
          paddingRight: '16px',
        }}
      >
        {sortedData.map((dept, index) => {
          const barWidth = dept.count > 0 ? Math.max((dept.count / maxCount) * 100, 8) : 0;
          const barColor = getBarColor(dept.count);

          return (
            <div
              key={dept.id || dept.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '28px',
                flexShrink: 0,
              }}
            >
              {/* Department name */}
              <div
                style={{
                  width: '110px',
                  flexShrink: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: dept.count > 0 ? DARK_THEME.text : DARK_THEME.textMuted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={dept.name}
              >
                {dept.name}
              </div>

              {/* Bar container */}
              <div style={{
                flex: 1,
                height: '18px',
                backgroundColor: 'rgba(79, 195, 247, 0.06)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {dept.count > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                    style={{
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '4px',
                      boxShadow: `0 0 8px ${barColor}40`,
                    }}
                  />
                )}
              </div>

              {/* Count */}
              <div
                style={{
                  width: '56px',
                  minWidth: '56px',
                  flexShrink: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: dept.count > 0 ? DARK_THEME.electric : DARK_THEME.textMuted,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {dept.count.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default DepartmentLoad;
