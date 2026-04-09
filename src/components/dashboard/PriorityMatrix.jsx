import React from 'react';
import { motion } from 'framer-motion';
import { DARK_THEME } from '@/constants/theme';

function PriorityMatrix({ data }) {
  // Guard against division by zero when all counts are 0
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {data.map((item, index) => (
        <div key={item.level}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: item.color }}>
                {item.level}
              </span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 600, color: item.color }}>
              {item.count}
            </span>
          </div>
          <div style={{ height: '10px', backgroundColor: `${item.color}10`, borderRadius: '5px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / maxCount) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              style={{ height: '100%', backgroundColor: item.color, borderRadius: '5px', boxShadow: `0 0 10px ${item.color}40` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PriorityMatrix;
