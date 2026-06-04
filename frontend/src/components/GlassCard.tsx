import React from 'react';
import { Paper, PaperProps, useTheme } from '@mui/material';

interface GlassCardProps extends PaperProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, sx, ...props }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      {...props}
      className={isDark ? 'glass-panel' : 'glass-panel-light'}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundImage: 'none',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export default GlassCard;
