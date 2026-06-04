import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  useTheme,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import { BrainCircuit, TrendingDown, TrendingUp, Sparkles, CheckSquare, Gauge } from 'lucide-react';
import { getInsightsAPI } from '../services/api';
import GlassCard from '../components/GlassCard';

export const IntelligenceCenter: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState(0);

  const { data: insights = [], isLoading, error } = useQuery({
    queryKey: ['insights'],
    queryFn: getInsightsAPI,
    refetchInterval: 20000, // refresh insights periodically
  });

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) return <LinearProgress color="primary" sx={{ mt: 5 }} />;
  if (error) return <Typography color="error">Error loading intelligence reports.</Typography>;

  const getTrendIcon = (trend: string) => {
    if (trend === 'Down') return <TrendingDown size={22} style={{ color: '#EF4444' }} />;
    if (trend === 'Up') return <TrendingUp size={22} style={{ color: '#22C55E' }} />;
    return <Gauge size={22} style={{ color: '#94A3B8' }} />;
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    return 'info';
  };

  // Group insights
  const executiveInsights = insights.filter((i: any) => i.scope === 'Executive');
  const regionalInsights = insights.filter((i: any) => i.scope === 'Regional');
  const storeInsights = insights.filter((i: any) => i.scope === 'Store');

  return (
    <Box>
      {/* Title */}
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <BrainCircuit size={32} color={theme.palette.primary.main} />
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            HiIntelligence Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-driven diagnostic analyzer running daily regression audits on store financial registers.
          </Typography>
        </Box>
      </Box>

      {/* Main Executive Insight Highlight */}
      {executiveInsights.length > 0 && (
        <GlassCard sx={{ mb: 4, position: 'relative', overflow: 'hidden' }}>
          {/* Subtle neon glow border */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: 'primary.main',
            }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <Sparkles size={20} color="#F59E0B" />
            <Typography variant="h6" fontWeight="700">
              System Wide Executive Summary
            </Typography>
          </Stack>
          
          <Typography variant="body1" sx={{ fontSize: '16px', lineHeight: 1.6, mb: 3 }}>
            {executiveInsights[0].summary}
          </Typography>
          
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="700" gutterBottom>
                Root Cause Diagnoses
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {executiveInsights[0].rootCause}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="700" gutterBottom>
                Mitigation Blueprint Actions
              </Typography>
              <Box>
                {executiveInsights[0].recommendedActions.split('\n').map((action: string, idx: number) => (
                  <Box key={idx} display="flex" gap={1} mb={1} alignItems="flex-start">
                    <CheckSquare size={16} color={theme.palette.primary.main} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography variant="body2">{action.replace('- ', '')}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </GlassCard>
      )}

      {/* Segment tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="insight scopes">
          <Tab label={`Store Insights (${storeInsights.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Regional Insights (${regionalInsights.length})`} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Render selected scope list */}
      <Grid container spacing={3}>
        {activeTab === 0 && (
          // Store Insights tab
          storeInsights.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">No store insights currently recorded.</Typography>
            </Grid>
          ) : (
            storeInsights.map((insight: any) => (
              <Grid item xs={12} md={6} key={insight.id}>
                <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="800">
                          {insight.targetName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Store Profile ID: #{insight.targetId}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {getTrendIcon(insight.trendDirection)}
                        <Chip
                          label={`Impact: ${insight.impactScore}`}
                          size="small"
                          color={getImpactColor(insight.impactScore)}
                          sx={{ fontSize: '9px', fontWeight: 'bold' }}
                        />
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="body2" fontWeight="600" color="text.primary" paragraph>
                      {insight.summary}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>
                      ROOT CAUSE:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                      {insight.rootCause}
                    </Typography>
                  </Box>

                  <Box mt={2} pt={2} borderTop={`1px solid ${theme.palette.divider}`}>
                    <Typography variant="caption" color="primary" fontWeight="700" display="block" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Sparkles size={12} color="#F59E0B" /> RECOVERY ACTIONS:
                    </Typography>
                    <Box>
                      {insight.recommendedActions.split('\n').map((action: string, idx: number) => (
                        <Box key={idx} display="flex" gap={1} mb={0.5} alignItems="flex-start">
                          <CheckSquare size={14} color={theme.palette.success.main} style={{ marginTop: 2, flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                            {action.replace('- ', '')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </GlassCard>
              </Grid>
            ))
          )
        )}

        {activeTab === 1 && (
          // Regional Insights tab
          regionalInsights.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">No regional trends calculated.</Typography>
            </Grid>
          ) : (
            regionalInsights.map((insight: any) => (
              <Grid item xs={12} key={insight.id}>
                <GlassCard>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="700">
                        Region: {insight.targetName}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {getTrendIcon(insight.trendDirection)}
                      <Chip
                        label={`Urgency: ${insight.impactScore}`}
                        size="small"
                        color={getImpactColor(insight.impactScore)}
                        sx={{ fontSize: '9px', fontWeight: 'bold' }}
                      />
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>
                        SUMMARY:
                      </Typography>
                      <Typography variant="body2" fontWeight="600" sx={{ lineHeight: 1.5 }}>
                        {insight.summary}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>
                        DIAGNOSTIC PATHOLOGY:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                        {insight.rootCause}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="primary" fontWeight="700" display="block" mb={0.5} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Sparkles size={12} color="#F59E0B" /> MITIGATION DIRECTIVES:
                      </Typography>
                      <Box>
                        {insight.recommendedActions.split('\n').map((action: string, idx: number) => (
                          <Box key={idx} display="flex" gap={1} mb={0.5} alignItems="flex-start">
                            <CheckSquare size={14} color={theme.palette.primary.main} style={{ marginTop: 2, flexShrink: 0 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                              {action.replace('- ', '')}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </GlassCard>
              </Grid>
            ))
          )
        )}
      </Grid>
    </Box>
  );
};

export default IntelligenceCenter;
