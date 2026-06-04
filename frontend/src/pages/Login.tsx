import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, Paper, Grid, Divider, useTheme } from '@mui/material';
import { loginAPI } from '../services/api';
import { setCredentials } from '../store/authSlice';
import { KeyRound, ShieldAlert, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await loginAPI({ username, password });
      
      // Save credentials in Redux and localStorage
      dispatch(setCredentials({
        token: data.token,
        username: data.username,
        role: data.role,
        assignedRegion: data.assignedRegion,
        assignedStoreId: data.assignedStoreId,
      }));

      // Redirect depending on user role
      if (data.role === 'StoreManager') {
        navigate(`/store/${data.assignedStoreId}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Connection to API failed. Make sure the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to quick login for testing
  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'radial-gradient(circle at 10% 20%, rgba(15, 23, 42, 0.95) 0%, rgba(11, 15, 25, 1) 90%)',
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        className="glass-panel"
        sx={{
          width: '100%',
          maxWidth: 460,
          p: 4.5,
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Box
            bgcolor="primary.main"
            p={1.5}
            borderRadius="50%"
            color="white"
            display="flex"
            justifyContent="center"
            alignItems="center"
            mb={2}
            sx={{
              boxShadow: '0 0 20px 0 rgba(37, 99, 235, 0.5)',
            }}
          >
            <KeyRound size={26} />
          </Box>
          <Typography variant="h4" fontWeight="800" sx={{ fontFamily: '"Outfit", sans-serif' }}>
            Hi<span style={{ color: theme.palette.primary.main }}>Intelligence</span>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Enterprise Financial Intelligence Portal
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" icon={<ShieldAlert size={18} />} sx={{ mb: 3, borderRadius: 2, fontSize: '12px' }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontSize: '15px', fontWeight: 'bold' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Box>
        </form>

        <Divider sx={{ my: 3 }} />

        {/* Quick Testing Credentials helper panel */}
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight="600" mb={1.5} align="center" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <Sparkles size={14} color="#F59E0B" /> Demo User Profiles (Click to Load)
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                size="small"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                sx={{ fontSize: '10px', py: 0.8, borderRadius: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Admin
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                size="small"
                onClick={() => handleQuickLogin('regional_east', 'east123')}
                sx={{ fontSize: '10px', py: 0.8, borderRadius: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Reg. Mgr
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                size="small"
                onClick={() => handleQuickLogin('store_101', 'store123')}
                sx={{ fontSize: '10px', py: 0.8, borderRadius: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Store Mgr
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
