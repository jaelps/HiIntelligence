import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Pagination,
  Stack,
  Divider,
  LinearProgress,
  useTheme
} from '@mui/material';
import { Search, Info, MapPin, User, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { RootState } from '../store';
import { getStoresAPI, getStoreByIdAPI, getStoreHistoryAPI } from '../services/api';
import signalRService from '../services/signalr';
import GlassCard from '../components/GlassCard';
import PerformanceGauge from '../components/PerformanceGauge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const StoreDashboard: React.FC = () => {
  const theme = useTheme();
  
  // Get logged-in user credentials and roles
  const { role, assignedStoreId, assignedRegion } = useSelector((state: RootState) => state.auth);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
    role === 'StoreManager' && assignedStoreId ? assignedStoreId : null
  );

  // Live real-time overrides for selected store
  const [liveStoreRevenue, setLiveStoreRevenue] = useState<number | null>(null);
  const [liveStoreSales, setLiveStoreSales] = useState<number | null>(null);
  const [liveStoreTicket, setLiveStoreTicket] = useState<number | null>(null);
  const [flashClass, setFlashClass] = useState('');

  // Fetch store list (only if not a locked store manager)
  const { data: listData, isLoading: isListLoading } = useQuery({
    queryKey: ['storesList', searchTerm, selectedRegion, selectedStatus, page],
    queryFn: () => getStoresAPI({
      search: searchTerm,
      region: selectedRegion,
      status: selectedStatus,
      page,
      pageSize: 8
    }),
    enabled: role !== 'StoreManager',
    refetchInterval: 10000,
  });

  // Fetch detailed info of selected store
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['storeDetail', selectedStoreId],
    queryFn: () => getStoreByIdAPI(selectedStoreId!),
    enabled: selectedStoreId !== null,
  });

  // Fetch 30-day historical analytics of selected store
  const { data: historyData } = useQuery({
    queryKey: ['storeHistory', selectedStoreId],
    queryFn: () => getStoreHistoryAPI(selectedStoreId!, 30),
    enabled: selectedStoreId !== null,
  });

  // SignalR real-time updates for the active detailed store
  useEffect(() => {
    if (!selectedStoreId) return;

    // Reset live overrides when store changes
    setLiveStoreRevenue(null);
    setLiveStoreSales(null);
    setLiveStoreTicket(null);

    const unsubscribe = signalRService.subscribeToUpdates((update) => {
      // Find update for our selected store
      if (update.storeUpdates) {
        const storeUpdate = update.storeUpdates.find((s: any) => s.storeId === selectedStoreId);
        if (storeUpdate) {
          setLiveStoreRevenue(storeUpdate.revenue);
          setLiveStoreSales(storeUpdate.salesVolume);
          setLiveStoreTicket(storeUpdate.averageTicket);
          
          // Trigger a quick flash animation on live tick!
          setFlashClass('flash-update-up');
          const timeout = setTimeout(() => setFlashClass(''), 1500);
          return () => clearTimeout(timeout);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedStoreId]);

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRegionChange = (e: any) => {
    setSelectedRegion(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: any) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleSelectStore = (id: number) => {
    setSelectedStoreId(id);
  };

  const handleBackToList = () => {
    if (role === 'StoreManager') return;
    setSelectedStoreId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Excellent') return 'success';
    if (status === 'Good') return 'primary';
    if (status === 'Attention') return 'warning';
    return 'error';
  };

  // Render Store Details view
  if (selectedStoreId !== null && detailData) {
    const store = detailData.store || {};
    const todayKpis = detailData.todayKpis || {};
    const weeklyAverages = detailData.weeklyAverages || {};
    
    // Merge live updates if available
    const displayRevenue = liveStoreRevenue !== null ? liveStoreRevenue : todayKpis.revenue;
    const displaySales = liveStoreSales !== null ? liveStoreSales : todayKpis.salesVolume;
    const displayTicket = liveStoreTicket !== null ? liveStoreTicket : todayKpis.averageTicket;

    return (
      <Box>
        {role !== 'StoreManager' && (
          <Button startIcon={<ArrowLeft size={18} />} onClick={handleBackToList} sx={{ mb: 3 }}>
            Back to store list
          </Button>
        )}

        <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="800" gutterBottom>
              {store.name}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                <MapPin size={16} />
                <Typography variant="body2">{store.address || 'Address N/A'}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                <User size={16} />
                <Typography variant="body2">Manager: {store.managerName}</Typography>
              </Box>
            </Stack>
          </Box>
          <Chip label={store.region} color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
        </Box>

        {/* Core Store stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <GlassCard className={flashClass}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                    Today Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="800" mt={1}>
                    {formatCurrency(displayRevenue)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                    Target quota: {formatCurrency(store.targetRevenue)}
                  </Typography>
                </GlassCard>
              </Grid>

              <Grid item xs={12} sm={4}>
                <GlassCard className={flashClass}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                    Today Sales Volume
                  </Typography>
                  <Typography variant="h4" fontWeight="800" mt={1}>
                    {displaySales}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                    Daily conversion: {todayKpis.conversionRate}%
                  </Typography>
                </GlassCard>
              </Grid>

              <Grid item xs={12} sm={4}>
                <GlassCard className={flashClass}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                    Average Ticket Size
                  </Typography>
                  <Typography variant="h4" fontWeight="800" mt={1}>
                    {formatCurrency(displayTicket)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                    Weekly average ticket: {formatCurrency(weeklyAverages.averageTicket)}
                  </Typography>
                </GlassCard>
              </Grid>

              <Grid item xs={12} sm={6}>
                <GlassCard>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="600" gutterBottom>
                    Profitability Matrix
                  </Typography>
                  <Box display="flex" justifyContent="space-between" py={1} borderBottom={`1px solid ${theme.palette.divider}`}>
                    <Typography variant="body2" color="text.secondary">Net Revenue:</Typography>
                    <Typography variant="body2" fontWeight="600">{formatCurrency(todayKpis.netRevenue)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2" color="text.secondary">Net Profit:</Typography>
                    <Typography variant="body2" fontWeight="600" color="success.main">{formatCurrency(todayKpis.netProfit)}</Typography>
                  </Box>
                </GlassCard>
              </Grid>

              <Grid item xs={12} sm={6}>
                <GlassCard>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="600" gutterBottom>
                    SLA Weekly Benchmarks
                  </Typography>
                  <Box display="flex" justifyContent="space-between" py={1} borderBottom={`1px solid ${theme.palette.divider}`}>
                    <Typography variant="body2" color="text.secondary">Daily Average Revenue:</Typography>
                    <Typography variant="body2" fontWeight="600">{formatCurrency(weeklyAverages.averageDailyRevenue)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2" color="text.secondary">Average Shopper Conversion:</Typography>
                    <Typography variant="body2" fontWeight="600" color="primary">{weeklyAverages.conversionRate}%</Typography>
                  </Box>
                </GlassCard>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={3}>
            <GlassCard sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PerformanceGauge 
                value={store.healthScore} 
                title={`${store.status} health`} 
                size={160}
                strokeWidth={12}
              />
            </GlassCard>
          </Grid>
        </Grid>

        {/* Historical charts (30 days) */}
        {historyData && historyData.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <GlassCard>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  30-Day Revenue Trend (BRL)
                </Typography>
                <Box height={260} width="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="date" stroke={theme.palette.text.secondary} style={{ fontSize: '10px' }} />
                      <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="#2563EB" fillOpacity={0.06} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </GlassCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <GlassCard>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Conversion Rate History (%)
                </Typography>
                <Box height={260} width="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="date" stroke={theme.palette.text.secondary} style={{ fontSize: '10px' }} />
                      <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '10px' }} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider }} />
                      <Line type="monotone" dataKey="conversionRate" stroke="#22C55E" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </GlassCard>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  }

  // Render Grid view of all stores
  const storeList = listData?.stores || [];
  const totalItems = listData?.totalItems || 0;
  const pageCount = Math.ceil(totalItems / 8);

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Store Analytics Grid
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor transaction parameters, health indicators, and daily sales metrics across all active stores.
        </Typography>
      </Box>

      {/* Filters bar */}
      <GlassCard sx={{ mb: 4, py: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search store name or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Region Filter</InputLabel>
              <Select
                value={selectedRegion}
                label="Region Filter"
                onChange={handleRegionChange}
                disabled={role === 'RegionalManager'}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Regions</MenuItem>
                <MenuItem value="North">North</MenuItem>
                <MenuItem value="South">South</MenuItem>
                <MenuItem value="East">East</MenuItem>
                <MenuItem value="West">West</MenuItem>
                <MenuItem value="Central">Central</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Health Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Health Status"
                onChange={handleStatusChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Health Categories</MenuItem>
                <MenuItem value="Excellent">Excellent (85+)</MenuItem>
                <MenuItem value="Good">Good (70-84)</MenuItem>
                <MenuItem value="Attention">Attention (50-69)</MenuItem>
                <MenuItem value="Critical">Critical (&lt;50)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </GlassCard>

      {/* Grid of Stores */}
      {isListLoading ? (
        <LinearProgress color="primary" />
      ) : storeList.length === 0 ? (
        <Box py={8} textAlign="center">
          <Typography variant="h6" color="text.secondary">No store logs match this filter.</Typography>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3} mb={4}>
            {storeList.map((store: any) => (
              <Grid item xs={12} sm={6} md={3} key={store.id}>
                <Card 
                  onClick={() => handleSelectStore(store.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6]
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="subtitle1" fontWeight="700" noWrap style={{ maxWidth: '170px' }}>
                        {store.name}
                      </Typography>
                      <Chip 
                        label={store.status} 
                        size="small" 
                        color={getStatusColor(store.status)}
                        sx={{ fontSize: '8px', fontWeight: 'bold', height: '18px' }}
                      />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">Region:</Typography>
                      <Typography variant="caption" fontWeight="600">{store.region}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">Health Score:</Typography>
                      <Typography variant="caption" fontWeight="700" color={`${getStatusColor(store.status)}.main`}>
                        {store.healthScore}/100
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Today Revenue:</Typography>
                      <Typography variant="caption" fontWeight="700">{formatCurrency(store.todayRevenue)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Paging */}
          {pageCount > 1 && (
            <Box display="flex" justifyContent="center">
              <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StoreDashboard;
