import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Menu,
  MenuItem,
  Button,
  Tooltip,
  useTheme,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  LayoutDashboard,
  Map,
  Store,
  BrainCircuit,
  Bell,
  FileSpreadsheet,
  LogOut,
  Sun,
  Moon,
  Radio
} from 'lucide-react';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { markAsRead, markAllAsRead } from '../store/notificationSlice';
import { signalRService } from '../services/signalr';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, toggleDarkMode, isDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { username, role, assignedRegion, assignedStoreId } = useSelector((state: RootState) => state.auth);
  const { items: notifications, unreadCount } = useSelector((state: RootState) => state.notifications);

  const [open, setOpen] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElProfile, setAnchorElProfile] = useState<null | HTMLElement>(null);

  // Initialize SignalR
  useEffect(() => {
    signalRService.startConnection();
    
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsLive(signalRService.isConnected());
    }, 2000);

    return () => {
      clearInterval(interval);
      signalRService.stopConnection();
    };
  }, []);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setAnchorElNotifications(null);
  };

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElProfile(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorElProfile(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (id: number, storeId: number | null) => {
    dispatch(markAsRead(id));
    handleNotificationsClose();
    if (storeId) {
      navigate(`/store/${storeId}`);
    } else {
      navigate('/alerts');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Performance Dashboard';
    if (path === '/regional') return 'Regional Performance & Goals';
    if (path.startsWith('/store')) return 'Store Detailed Analyzer';
    if (path === '/intelligence') return 'Intelligence Center';
    if (path === '/alerts') return 'Real-Time Alerts Log';
    if (path === '/reports') return 'BI Exports & Reports Builder';
    return 'HiIntelligence BI';
  };

  const navigationItems = [
    { text: 'Executive Dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: ['Administrator', 'RegionalManager'] },
    { text: 'Regional Analytics', icon: <Map size={20} />, path: '/regional', roles: ['Administrator', 'RegionalManager'] },
    { text: 'Store Analyzer', icon: <Store size={20} />, path: '/store', roles: ['Administrator', 'RegionalManager', 'StoreManager'] },
    { text: 'Intelligence Center', icon: <BrainCircuit size={20} />, path: '/intelligence', roles: ['Administrator', 'RegionalManager', 'StoreManager'] },
    { text: 'Alerts Center', icon: <Bell size={20} />, path: '/alerts', roles: ['Administrator', 'RegionalManager', 'StoreManager'] },
    { text: 'Reports Builder', icon: <FileSpreadsheet size={20} />, path: '/reports', roles: ['Administrator', 'RegionalManager', 'StoreManager'] },
  ];

  const filteredNavItems = navigationItems.filter(item => item.roles.includes(role || ''));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ marginRight: 2, ...(open && { display: 'none' }) }}
            >
              <MenuIcon size={22} />
            </IconButton>
            <Typography variant="h6" fontWeight="700" component="div" sx={{ fontFamily: '"Outfit", sans-serif' }}>
              {getPageTitle()}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            
            {/* Live Socket Status Indicator */}
            <Tooltip title={isLive ? "SignalR Socket Active" : "Disconnected / Syncing"}>
              <Chip
                icon={<Radio size={14} className={isLive ? 'pulse-live' : ''} style={{ color: isLive ? '#22C55E' : '#EF4444' }} />}
                label={isLive ? "Live Sync" : "Syncing"}
                size="small"
                variant="outlined"
                color={isLive ? "success" : "error"}
                sx={{ 
                  borderRadius: 1, 
                  px: 0.5,
                  fontSize: '11px',
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Tooltip>

            {/* Dark/Light Toggle */}
            <IconButton onClick={toggleDarkMode} color="inherit">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            {/* Notification drop panel */}
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={unreadCount} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorElNotifications}
              open={Boolean(anchorElNotifications)}
              onClose={handleNotificationsClose}
              PaperProps={{
                sx: {
                  width: 360,
                  maxHeight: 480,
                  borderRadius: 2,
                  mt: 1.5,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[10],
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" px={2.5} py={1.5}>
                <Typography variant="subtitle1" fontWeight="700">Real-Time Alerts</Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '11px' }}>
                    Clear All
                  </Button>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No active notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((notif) => (
                  <MenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.storeId)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      whiteSpace: 'normal',
                      backgroundColor: notif.isRead 
                        ? 'transparent' 
                        : (notif.severity === 'Critical' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.04)')
                    }}
                  >
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        <Chip 
                          label={notif.severity} 
                          size="small" 
                          color={notif.severity === 'Critical' ? 'error' : (notif.severity === 'Warning' ? 'warning' : 'info')}
                          sx={{ fontSize: '9px', height: '18px', fontWeight: 'bold' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={notif.isRead ? 500 : 700}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notif.message}
                      </Typography>
                      {notif.recommendedAction && (
                        <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1} borderLeft={`3px solid ${theme.palette.primary.main}`}>
                          <Typography variant="caption" fontWeight="600" display="block" color="primary">
                            Recommended Action:
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notif.recommendedAction}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>

            {/* Profile Dropdown */}
            <Box display="flex" alignItems="center" gap={1} onClick={handleProfileOpen} sx={{ cursor: 'pointer' }}>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                  {username}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {role === 'RegionalManager' ? `${assignedRegion} Regional` : (role === 'StoreManager' ? `Store Manager` : 'Administrator')}
                </Typography>
              </Box>
              <IconButton color="inherit" size="small">
                <Box
                  component="div"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {username?.charAt(0).toUpperCase()}
                </Box>
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorElProfile}
              open={Boolean(anchorElProfile)}
              onClose={handleProfileClose}
              PaperProps={{
                sx: {
                  width: 200,
                  borderRadius: 2,
                  mt: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box p={2}>
                <Typography variant="subtitle2" fontWeight="700">{username}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{role}</Typography>
                {assignedRegion && <Typography variant="caption" color="text.secondary" display="block">Region: {assignedRegion}</Typography>}
                {assignedStoreId && <Typography variant="caption" color="text.secondary" display="block">Store ID: #{assignedStoreId}</Typography>}
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogOut size={16} /></ListItemIcon>
                <ListItemText primary="Log Out" />
              </MenuItem>
            </Menu>

          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          ...(open && {
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#FFFFFF',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }),
          ...(!open && {
            '& .MuiDrawer-paper': {
              width: theme.spacing(7),
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              overflowX: 'hidden',
              backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#FFFFFF',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }),
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={2.5} py={2} minHeight="64px">
          <Typography variant="h5" fontWeight="800" sx={{ fontFamily: '"Outfit", sans-serif', color: 'primary.main', display: open ? 'block' : 'none' }}>
            Hi<span style={{ color: theme.palette.text.primary }}>Intelligence</span>
          </Typography>
          <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {open ? <ChevronLeft size={20} /> : <MenuIcon size={20} />}
          </IconButton>
        </Box>
        <Divider />
        
        <List sx={{ px: 1, py: 2 }}>
          {filteredNavItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    color: isSelected ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isSelected ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      '& .MuiTypography-root': { fontWeight: isSelected ? 600 : 500, fontSize: '14px' } 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8,
          overflowX: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? '#0B0F19' : '#F8FAFC',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>

      {/* Styling specific custom animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .pulse-live {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </Box>
  );
};

export default Layout;
