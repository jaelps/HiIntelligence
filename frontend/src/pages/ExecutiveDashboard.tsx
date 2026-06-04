import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Typography, useTheme, Card, CardContent, Divider, List, ListItem, ListItemText, LinearProgress } from '@mui/material';
import { DollarSign, AlertTriangle, Activity, Percent, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
import { getExecutiveAPI, getStoresAPI } from '../services/api';
import signalRService from '../services/signalr';
import GlassCard from '../components/GlassCard';
import PerformanceGauge from '../components/PerformanceGauge';
import StoreHeatMap from '../components/StoreHeatMap';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const theme = useTheme();
  
  // Real-time ticking indicators
  const [liveRevenue, setLiveRevenue] = useState<number | null>(null);
  const [liveSales, setLiveSales] = useState<number | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<number | null>(null);
  const [tickerLogs, setTickerLogs] = useState<any[]>([]);

  // Fetch baseline static executive data
  const { data, isLoading, error } = useQuery({
    queryKey: ['executiveData'],
    queryFn: getExecutiveAPI,
    refetchInterval: 15000, // refresh static cache every 15s
  });

  // Fetch all stores for the Status Heatmap grid (page size 600 to fetch all 520 stores)
  const { data: storesData } = useQuery({
    queryKey: ['heatmapStores'],
    queryFn: () => getStoresAPI({ pageSize: 600 }),
  });

  // SignalR Real-time subscription
  useEffect(() => {
    const unsubscribe = signalRService.subscribeToUpdates((update) => {
      // update contains { TotalRevenue, TotalSales, ActiveAlerts, StoreUpdates }
      setLiveRevenue(update.totalRevenue);
      setLiveSales(update.totalSales);
      setLiveAlerts(update.activeAlerts);
      
      if (update.storeUpdates && update.storeUpdates.length > 0) {
        setTickerLogs((prev) => {
          const freshLogs = [...update.storeUpdates, ...prev];
          return freshLogs.slice(0, 8); // Keep last 8 transaction logs
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) return <LinearProgress color="primary" sx={{ mt: 5 }} />;
  if (error) return <Typography color="error">Error loading executive dashboard data. Verify backend status.</Typography>;

  const kpis = data?.kpis || {};
  const trends = data?.trends || {};
  const regions = data?.regions || [];
  const heatmapStores = storesData?.stores || [];

  // Override static KPIs with SignalR live metrics
  const displayRevenue = liveRevenue !== null ? liveRevenue : kpis.totalRevenue;
  const displaySales = liveSales !== null ? liveSales : 4762; // fallback seed sales
  const displayAlerts = liveAlerts !== null ? liveAlerts : kpis.activeAlerts;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getKPIChangeColor = (val: number) => (val >= 0 ? 'success.main' : 'error.main');

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Platform Intelligence Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Synthesizing operational parameters for {kpis.totalStores || 520} stores in real-time.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Live Today Revenue
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(displayRevenue)}
                </Typography>
              </Box>
              <Box bgcolor="rgba(37, 99, 235, 0.1)" p={1.5} borderRadius={2} color="primary.main">
                <DollarSign size={22} />
              </Box>
            </Box>
            <Box display="flex" alignItems="center" mt={2} gap={0.5}>
              <ArrowUpRight size={16} color="#22C55E" />
              <Typography variant="caption" color="success.main" fontWeight="600">
                +4.2%
              </Typography>
              <Typography variant="caption" color="text.secondary" ml={0.5}>
                versus yesterday
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Net Profit (Margin)
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(kpis.netProfit || displayRevenue * 0.15)}
                </Typography>
              </Box>
              <Box bgcolor="rgba(34, 197, 94, 0.1)" p={1.5} borderRadius={2} color="success.main">
                <Percent size={22} />
              </Box>
            </Box>
            <Box display="flex" alignItems="center" mt={2} gap={0.5}>
              <ArrowUpRight size={16} color="#22C55E" />
              <Typography variant="caption" color="success.main" fontWeight="600">
                15.4%
              </Typography>
              <Typography variant="caption" color="text.secondary" ml={0.5}>
                net margin target met
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Active Alerts
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, fontFamily: '"Outfit", sans-serif', color: displayAlerts > 0 ? 'error.main' : 'text.primary' }}>
                  {displayAlerts}
                </Typography>
              </Box>
              <Box 
                bgcolor={displayAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)'} 
                p={1.5} 
                borderRadius={2} 
                color={displayAlerts > 0 ? 'error.main' : 'text.secondary'}
              >
                <AlertTriangle size={22} />
              </Box>
            </Box>
            <Box display="flex" alignItems="center" mt={2} gap={0.5}>
              <Typography variant="caption" color={displayAlerts > 0 ? 'error.main' : 'text.secondary'} fontWeight="600">
                {displayAlerts > 0 ? 'Urgent attention required' : 'System healthy'}
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                  Network Health Score
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {kpis.performanceScore || 82.5}%
                </Typography>
              </Box>
              <Box bgcolor="rgba(245, 158, 11, 0.1)" p={1.5} borderRadius={2} color="warning.main">
                <Activity size={22} />
              </Box>
            </Box>
            <Box display="flex" alignItems="center" mt={2} gap={0.5}>
              <Chip 
                label="GOOD" 
                size="small" 
                color="success" 
                sx={{ fontSize: '9px', fontWeight: 'bold', height: '16px' }} 
              />
              <Typography variant="caption" color="text.secondary" ml={0.5}>
                average stores health score
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3} mb={4}>
        
        {/* Revenue Trend chart */}
        <Grid item xs={12} lg={8}>
          <GlassCard sx={{ height: '100%', minHeight: '380px' }}>
            <Typography variant="h6" fontWeight="600" mb={3}>
              Daily Revenue Overlap (Current Week vs Previous Week)
            </Typography>
            <Box height={300} width="100%">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends.currentWeek || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} style={{ fontSize: '11px' }} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    name="Current Week"
                    dataKey="revenue" 
                    stroke="#2563EB" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCurrent)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Goal Achievement & Region Performance */}
        <Grid item xs={12} lg={4}>
          <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '380px' }}>
            <Typography variant="h6" fontWeight="600" mb={2}>
              Annual Revenue Goal
            </Typography>
            <Box py={2}>
              <PerformanceGauge 
                value={kpis.goalAchievement || 78.4} 
                title="Year-to-Date Goal Completion" 
                size={160}
                strokeWidth={14}
              />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between" textAlign="center">
              <Box>
                <Typography variant="caption" color="text.secondary">Goal Target</Typography>
                <Typography variant="subtitle2" fontWeight="700">R$ 15.000.000</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Total</Typography>
                <Typography variant="subtitle2" fontWeight="700" color="primary">R$ 11.760.000</Typography>
              </Box>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Regional performance bar chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={7}>
          <GlassCard sx={{ height: '100%', minHeight: '360px' }}>
            <Typography variant="h6" fontWeight="600" mb={3}>
              Regional Goal Compliance (Revenue vs Target)
            </Typography>
            <Box height={280} width="100%">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="region" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary 
                    }} 
                  />
                  <Legend />
                  <Bar name="Actual Revenue (BRL)" dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar name="Weekly Target (BRL)" dataKey="target" fill="#64748B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* Real-time ticker stream logs */}
        <Grid item xs={12} md={5}>
          <GlassCard sx={{ height: '100%', minHeight: '360px', overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="600" mb={1} display="flex" alignItems="center" gap={1}>
              Live Transaction Ticker
              <Box width={8} height={8} bgcolor="#22C55E" borderRadius="50%" className="pulse-live" />
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Real-time sales updates streaming from SignalR active terminals.
            </Typography>
            
            <List sx={{ maxHeight: '250px', overflowY: 'auto', pr: 1 }}>
              {tickerLogs.length === 0 ? (
                <Box py={5} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Waiting for incoming live transactions...
                  </Typography>
                </Box>
              ) : (
                tickerLogs.map((log, index) => (
                  <ListItem
                    key={`${log.storeId}-${index}`}
                    sx={{
                      py: 1,
                      px: 1.5,
                      mb: 1,
                      borderRadius: 1.5,
                      borderLeft: `3px solid ${log.healthScore >= 85 ? '#22C55E' : (log.healthScore >= 70 ? '#3B82F6' : '#EF4444')}`,
                      bgcolor: 'action.hover',
                      animation: 'flash-green 1s ease-out',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="700">
                            {log.storeName}
                          </Typography>
                          <Typography variant="body2" fontWeight="700" color="primary">
                            +{formatCurrency(log.revenue / log.salesVolume)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Sales Count: {log.salesVolume} | Ticket: {formatCurrency(log.averageTicket)}
                          </Typography>
                          <Chip 
                            label={`Health: ${log.healthScore}`} 
                            size="small"
                            variant="outlined" 
                            color={log.healthScore >= 75 ? 'success' : 'error'}
                            sx={{ fontSize: '8px', height: '14px', px: 0 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Interactive Datadog-style Heat Map representing 500+ stores */}
      {heatmapStores.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <GlassCard>
              <StoreHeatMap stores={heatmapStores} />
            </GlassCard>
          </Grid>
        </Grid>
      )}

    </Box>
  );
};

export default ExecutiveDashboard;
