import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface PerformanceGaugeProps {
  value: number; // 0 to 100
  title: string;
  size?: number;
  strokeWidth?: number;
}

export const PerformanceGauge: React.FC<PerformanceGaugeProps> = ({
  value,
  title,
  size = 120,
  strokeWidth = 10,
}) => {
  const theme = useTheme();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  // Determine color based on value
  const getColor = () => {
    if (value >= 85) return theme.palette.success.main;
    if (value >= 70) return theme.palette.info?.main || '#3B82F6';
    if (value >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const currentColor = getColor();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Box position="relative" width={size} height={size}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        {/* Value text center */}
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h5" component="div" fontWeight="700">
            {Math.round(value)}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', textTransform: 'uppercase' }}>
            Score
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5, fontWeight: '600', color: 'text.secondary' }}>
        {title}
      </Typography>
    </Box>
  );
};

export default PerformanceGauge;
