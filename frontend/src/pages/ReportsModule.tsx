import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  TextField,
  Divider,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import { FileSpreadsheet, Download, HelpCircle, CheckCircle2 } from 'lucide-react';
import { RootState } from '../store';
import { downloadReportAPI } from '../services/api';
import GlassCard from '../components/GlassCard';

export const ReportsModule: React.FC = () => {
  const { role, assignedRegion, assignedStoreId } = useSelector((state: RootState) => state.auth);

  // Form States
  const [reportType, setReportType] = useState<string>(
    role === 'StoreManager' ? 'store' : (role === 'RegionalManager' ? 'regional' : 'executive')
  );
  const [format, setFormat] = useState<string>('csv');
  const [selectedRegion, setSelectedRegion] = useState<string>(assignedRegion || '');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    assignedStoreId ? assignedStoreId.toString() : ''
  );
  const [historyDays, setHistoryDays] = useState<number>(30);

  // Status states
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const sId = selectedStoreId ? parseInt(selectedStoreId) : undefined;
      const reg = selectedRegion || undefined;

      const blob = await downloadReportAPI(
        reportType,
        format,
        reg,
        sId,
        historyDays
      );

      // Create download link dynamically
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;

      // Determine extension
      let ext = 'csv';
      if (format === 'excel') ext = 'xls';
      if (format === 'pdf') ext = 'html'; // represented as HTML print layout

      link.setAttribute('download', `HiIntelligence_${reportType}_report_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMsg(`Report generated and downloaded successfully as ${format.toUpperCase()}.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to compile report. Make sure the requested parameters exist.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <FileSpreadsheet size={32} color="#2563EB" />
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Reports Export Module
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compile operational matrices and export financial audit logs in Excel, CSV, or HTML (PDF layout) files.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <GlassCard>
            <Typography variant="h6" fontWeight="700" mb={3}>
              Query Compilation Parameters
            </Typography>

            {successMsg && (
              <Alert severity="success" icon={<CheckCircle2 size={18} />} sx={{ mb: 3, borderRadius: 2 }}>
                {successMsg}
              </Alert>
            )}

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleExport}>
              <Grid container spacing={2.5}>
                
                {/* Scope selector */}
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Report Level Scope</InputLabel>
                    <Select
                      value={reportType}
                      label="Report Level Scope"
                      onChange={(e) => setReportType(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="executive" disabled={role === 'RegionalManager' || role === 'StoreManager'}>
                        Executive Summary Network Log
                      </MenuItem>
                      <MenuItem value="regional" disabled={role === 'StoreManager'}>
                        Regional Performance & Goals Target
                      </MenuItem>
                      <MenuItem value="store">
                        Store-Specific Daily Register Log
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Region selector */}
                {reportType !== 'executive' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target Region</InputLabel>
                      <Select
                        value={selectedRegion}
                        label="Target Region"
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        disabled={role === 'RegionalManager' || role === 'StoreManager'}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All Regions</MenuItem>
                        <MenuItem value="North">North Region</MenuItem>
                        <MenuItem value="South">South Region</MenuItem>
                        <MenuItem value="East">East Region</MenuItem>
                        <MenuItem value="West">West Region</MenuItem>
                        <MenuItem value="Central">Central Region</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Store ID selector */}
                {reportType === 'store' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Target Store ID (Optional)"
                      size="small"
                      type="number"
                      placeholder="e.g. 154"
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      disabled={role === 'StoreManager'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                )}

                {/* Days length selector */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Range Span</InputLabel>
                    <Select
                      value={historyDays}
                      label="Date Range Span"
                      onChange={(e) => setHistoryDays(e.target.value as number)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={7}>Previous 7 Days</MenuItem>
                      <MenuItem value={15}>Previous 15 Days</MenuItem>
                      <MenuItem value={30}>Previous 30 Days</MenuItem>
                      <MenuItem value={90}>Previous 90 Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Format selection */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1.5 }} />
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
                      Export Format Selection
                    </FormLabel>
                    <RadioGroup
                      row
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                    >
                      <FormControlLabel value="csv" control={<Radio />} label="Comma Separated (CSV)" />
                      <FormControlLabel value="excel" control={<Radio />} label="Microsoft Excel (XLS)" />
                      <FormControlLabel value="pdf" control={<Radio />} label="HTML Layout (PDF Print)" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={downloading}
                    startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download size={20} />}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {downloading ? 'Compiling Registers...' : 'Generate and Download Report'}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <GlassCard sx={{ height: '100%' }}>
            <Typography variant="h6" fontWeight="700" mb={3} display="flex" alignItems="center" gap={1}>
              <HelpCircle size={20} color="#F59E0B" /> Export Guidelines
            </Typography>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight="600">CSV Export</Typography>
                <Typography variant="body2" color="text.secondary">
                  Raw matrix dumps optimized for external ingestion by analytics platforms like Tableau, Power BI, or script workflows.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="600">Excel Export</Typography>
                <Typography variant="body2" color="text.secondary">
                  Formatted tables encoding BOM headers, guaranteeing correct display inside Microsoft Excel worksheets.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="600">HTML Layout (PDF Print)</Typography>
                <Typography variant="body2" color="text.secondary">
                  A high-end, executive-styled HTML report. Opens directly in your browser. Perfect for saving as PDF or printing at 100% vector scale.
                </Typography>
              </Box>
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsModule;
