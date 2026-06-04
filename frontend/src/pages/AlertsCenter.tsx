import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
  useTheme,
  Alert as MuiAlert
} from '@mui/material';
import { Check, ShieldAlert, Sparkles, Bell } from 'lucide-react';
import { getAlertsAPI, acknowledgeAlertAPI } from '../services/api';
import GlassCard from '../components/GlassCard';

export const AlertsCenter: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // States
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('false'); // default to active alerts

  // Fetch alerts
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['alerts', filterStatus, filterSeverity],
    queryFn: () => getAlertsAPI(
      filterStatus === 'all' ? undefined : (filterStatus === 'true'),
      filterSeverity || undefined
    ),
    refetchInterval: 5000, // pull real-time alerts every 5s
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlertAPI,
    onSuccess: () => {
      // Invalidate queries to reload alert tables
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['executiveData'] });
      queryClient.invalidateQueries({ queryKey: ['regionalData'] });
    },
  });

  const handleAcknowledge = (id: number) => {
    acknowledgeMutation.mutate(id);
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical') return 'error';
    if (sev === 'Warning') return 'warning';
    return 'info';
  };

  const getAlertIcon = (sev: string) => {
    if (sev === 'Critical') return <ShieldAlert size={16} style={{ color: '#EF4444' }} />;
    if (sev === 'Warning') return <ShieldAlert size={16} style={{ color: '#F59E0B' }} />;
    return <Bell size={16} style={{ color: '#3B82F6' }} />;
  };

  if (isLoading) return <LinearProgress color="primary" sx={{ mt: 5 }} />;
  if (error) return <Typography color="error">Error loading alerts log.</Typography>;

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Real-Time Incident Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit anomalous data trajectories, critical operational indices, and trigger manual resolution workflows.
        </Typography>
      </Box>

      {/* Filter controls */}
      <GlassCard sx={{ mb: 4, py: 2 }}>
        <Stack direction="row" spacing={3}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Alerts</MenuItem>
              <MenuItem value="false">Active Incidents</MenuItem>
              <MenuItem value="true">Acknowledged Incidents</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Severity</InputLabel>
            <Select
              value={filterSeverity}
              label="Severity"
              onChange={(e) => setFilterSeverity(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Severities</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
              <MenuItem value="Warning">Warning</MenuItem>
              <MenuItem value="Informational">Informational</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </GlassCard>

      {/* Alerts Table */}
      {alerts.length === 0 ? (
        <MuiAlert severity="success" sx={{ borderRadius: 3 }}>
          No active anomalies matching the filters. The network is operating under healthy parameter ranges.
        </MuiAlert>
      ) : (
        <TableContainer component={Paper} className="glass-panel" sx={{ borderRadius: 3, border: 'none', backgroundImage: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Severity / Code</TableCell>
                <TableCell>Operational Anomaly Details</TableCell>
                <TableCell>Suggested Mitigation Blueprint</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert: any) => (
                <TableRow 
                  key={alert.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <TableCell style={{ verticalAlign: 'top', width: '120px' }}>
                    <Typography variant="body2" fontWeight="600">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell style={{ verticalAlign: 'top', fontWeight: '700', width: '130px' }}>
                    {alert.storeName}
                    <Typography variant="caption" color="text.secondary" display="block">ID: #{alert.storeId}</Typography>
                  </TableCell>

                  <TableCell style={{ verticalAlign: 'top', width: '150px' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getAlertIcon(alert.severity)}
                      <Chip 
                        label={alert.severity} 
                        size="small" 
                        color={getSeverityColor(alert.severity)} 
                        sx={{ fontSize: '9px', fontWeight: 'bold' }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, textTransform: 'uppercase', fontSize: '9px', fontWeight: '600' }}>
                      {alert.type}
                    </Typography>
                  </TableCell>

                  <TableCell style={{ verticalAlign: 'top', fontSize: '13px' }}>
                    {alert.message}
                  </TableCell>

                  <TableCell style={{ verticalAlign: 'top', fontSize: '13px', width: '280px' }}>
                    <Box p={1.5} bgcolor="rgba(37, 99, 235, 0.04)" borderRadius={1.5} borderLeft={`3px solid ${theme.palette.primary.main}`}>
                      <Typography variant="caption" fontWeight="600" display="block" color="primary" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Sparkles size={11} color="#F59E0B" /> MITIGATION STEPS:
                      </Typography>
                      {alert.recommendedAction}
                    </Box>
                  </TableCell>

                  <TableCell align="center" style={{ verticalAlign: 'top', width: '120px' }}>
                    {alert.isAcknowledged ? (
                      <Chip label="Resolved" size="small" variant="outlined" color="success" icon={<Check size={12} />} />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<Check size={14} />}
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                        sx={{ fontSize: '11px', px: 1.5 }}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AlertsCenter;
