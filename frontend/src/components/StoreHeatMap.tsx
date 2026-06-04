import React, { useState } from 'react';
import { Box, Typography, Tooltip, Grid, useTheme } from '@mui/material';

interface MiniStoreData {
  id: number;
  name: string;
  region: string;
  healthScore: number;
  status: string;
}

interface StoreHeatMapProps {
  stores: MiniStoreData[];
}

export const StoreHeatMap: React.FC<StoreHeatMapProps> = ({ stores }) => {
  const theme = useTheme();
  
  // Group stores by region
  const regions = ["North", "South", "East", "West", "Central"];
  
  const getStatusColor = (score: number) => {
    if (score >= 85) return '#22C55E'; // Success Green
    if (score >= 70) return '#3B82F6'; // Corporate Blue / Good
    if (score >= 50) return '#F59E0B'; // Warning Orange
    return '#EF4444'; // Critical Red
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="600">
          Network Overview (500+ Stores Status Map)
        </Typography>
        <Box display="flex" gap={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={10} height={10} borderRadius={0.5} bgcolor="#22C55E" />
            <Typography variant="caption" color="text.secondary">Excellent (85+)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={10} height={10} borderRadius={0.5} bgcolor="#3B82F6" />
            <Typography variant="caption" color="text.secondary">Good (70-84)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={10} height={10} borderRadius={0.5} bgcolor="#F59E0B" />
            <Typography variant="caption" color="text.secondary">Attention (50-69)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={10} height={10} borderRadius={0.5} bgcolor="#EF4444" />
            <Typography variant="caption" color="text.secondary">Critical (&lt;50)</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {regions.map((region) => {
          const regionalStores = stores.filter(s => s.region === region);
          
          return (
            <Grid item xs={12} key={region}>
              <Box mb={1}>
                <Typography variant="body2" fontWeight="600" color="text.secondary">
                  {region} Region ({regionalStores.length} Stores)
                </Typography>
              </Box>
              
              {/* Heat Map grid pixels */}
              <Box 
                display="flex" 
                flexWrap="wrap" 
                gap="3px" 
                p={1.5} 
                borderRadius={2}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                {regionalStores.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No store data.</Typography>
                ) : (
                  regionalStores.map((store) => (
                    <Tooltip
                      key={store.id}
                      title={
                        <Box p={0.5}>
                          <Typography variant="subtitle2" fontWeight="600">{store.name}</Typography>
                          <Typography variant="caption" display="block">ID: #{store.id}</Typography>
                          <Typography variant="caption" display="block">Health Score: {store.healthScore}</Typography>
                          <Typography variant="caption" display="block">Status: {store.status}</Typography>
                        </Box>
                      }
                      arrow
                    >
                      <Box
                        sx={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          backgroundColor: getStatusColor(store.healthScore),
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease, filter 0.1s ease',
                          '&:hover': {
                            transform: 'scale(1.3)',
                            filter: 'brightness(1.2)',
                            zIndex: 2
                          }
                        }}
                      />
                    </Tooltip>
                  ))
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StoreHeatMap;
