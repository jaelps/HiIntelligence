import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
  Stack
} from '@mui/material';
import { RootState } from '../store';
import { getRegionalAPI } from '../services/api';
import GlassCard from '../components/GlassCard';
import PerformanceGauge from '../components/PerformanceGauge';
import { AlertCircle, TrendingUp, TrendingDown, Star } from 'lucide-react';

export const RegionalDashboard: React.FC = () => {
  const theme = useTheme();
  
  // Get logged-in user credentials and roles
  const { role, assignedRegion } = useSelector((state: RootState) => state.auth);

  // Set default selected region (if Regional Manager, lock to assignedRegion)
  const defaultRegion = role === 'RegionalManager' && assignedRegion ? assignedRegion : 'East';
  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion);

  // Fetch regional summary
  const { data, isLoading, error } = useQuery({
    queryKey: ['regionalData', selectedRegion],
    queryFn: () => getRegionalAPI(selectedRegion),
    refetchInterval: 12000,
  });

  const handleRegionChange = (e: any) => {
    setSelectedRegion(e.target.value);
  };

  if (isLoading) return <LinearProgress color="primary" sx={{ mt: 5 }} />;
  if (error) return <Typography color="error">Error loading regional data.</Typography>;

  const kpis = data?.kpis || {};
  const rankings = data?.rankings || { topStores: [], bottomStores: [] };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Regional Analytics Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage goals, track compliance, and view performance rankings by administrative sector.
          </Typography>
        </Box>

        {/* Region Selector (disabled if user is a locked regional manager) */}
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="region-select-label">Select Region</InputLabel>
          <Select
            labelId="region-select-label"
            value={selectedRegion}
            label="Select Region"
            onChange={handleRegionChange}
            disabled={role === 'RegionalManager'}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="North">North Region</MenuItem>
            <MenuItem value="South">South Region</MenuItem>
            <MenuItem value="East">East Region</MenuItem>
            <MenuItem value="West">West Region</MenuItem>
            <MenuItem value="Central">Central Region</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Regional summary metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <GlassCard>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Regional Revenue Today
                </Typography>
                <Typography variant="h3" fontWeight="800" mt={1} sx={{ fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(kpis.revenue || 0)}
                </Typography>
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Weekly projected regional run-rate: {formatCurrency((kpis.revenue || 0) * 7)}
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <GlassCard>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Active Regional Alerts
                </Typography>
                <Typography variant="h3" fontWeight="800" mt={1} sx={{ fontFamily: '"Outfit", sans-serif', color: kpis.alerts > 0 ? 'error.main' : 'text.primary' }}>
                  {kpis.alerts}
                </Typography>
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                  <AlertCircle size={14} color={kpis.alerts > 0 ? '#EF4444' : '#22C55E'} />
                  <Typography variant="caption" color="text.secondary">
                    {kpis.alerts > 0 ? 'Require immediate supervisor review' : 'No active alerts in this sector'}
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <GlassCard>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Sector Target Target
                </Typography>
                <Typography variant="h3" fontWeight="800" mt={1} sx={{ fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(kpis.target || 0)}
                </Typography>
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Summed daily quotas for region
                  </Typography>
                </Box>
              </GlassCard>
            </Grid>

            <Grid item xs={12} sm={6}>
              <GlassCard>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Average Sector Health
                </Typography>
                <Typography variant="h3" fontWeight="800" mt={1} sx={{ fontFamily: '"Outfit", sans-serif' }}>
                  {kpis.averageHealth || 0}/100
                </Typography>
                <Box mt={2}>
                  <LinearProgress
                    variant="determinate"
                    value={kpis.averageHealth || 0}
                    color={kpis.averageHealth >= 80 ? 'success' : (kpis.averageHealth >= 65 ? 'warning' : 'error')}
                    sx={{ height: 6, borderRadius: 2 }}
                  />
                </Box>
              </GlassCard>
            </Grid>
          </Grid>
        </Grid>

        {/* Circular Gauge */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PerformanceGauge 
              value={kpis.goalAchievement || 0} 
              title="Regional Target Fulfilled" 
              size={180}
              strokeWidth={14}
            />
          </GlassCard>
        </Grid>
      </Grid>

      {/* Rankings Section */}
      <Grid container spacing={3}>
        
        {/* Top Performing Stores */}
        <Grid item xs={12} md={6}>
          <GlassCard>
            <Typography variant="h6" fontWeight="600" mb={3} display="flex" alignItems="center" gap={1}>
              <Star size={18} color="#22C55E" />
              Top 5 Performing Stores (BRL Weekly)
            </Typography>
            
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Store Name</TableCell>
                    <TableCell align="right">Weekly Revenue</TableCell>
                    <TableCell align="right">Health Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankings.topStores.map((row: any) => (
                    <TableRow key={row.storeId}>
                      <TableCell sx={{ fontWeight: '600' }}>
                        {row.storeName}
                        <Typography variant="caption" color="text.secondary" display="block">ID: #{row.storeId}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {formatCurrency(row.totalRevenue)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={row.averageHealth} size="small" color="success" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </GlassCard>
        </Grid>

        {/* Bottom Performing Stores (Attention) */}
        <Grid item xs={12} md={6}>
          <GlassCard>
            <Typography variant="h6" fontWeight="600" mb={3} display="flex" alignItems="center" gap={1}>
              <AlertCircle size={18} color="#EF4444" />
              Bottom 5 Stores (Attention Needed)
            </Typography>
            
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Store Name</TableCell>
                    <TableCell align="right">Weekly Revenue</TableCell>
                    <TableCell align="right">Health Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankings.bottomStores.map((row: any) => (
                    <TableRow key={row.storeId}>
                      <TableCell sx={{ fontWeight: '600' }}>
                        {row.storeName}
                        <Typography variant="caption" color="text.secondary" display="block">ID: #{row.storeId}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        {formatCurrency(row.totalRevenue)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.averageHealth} 
                          size="small" 
                          color={row.averageHealth >= 65 ? 'warning' : 'error'} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RegionalDashboard;
