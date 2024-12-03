import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Pets as PetsIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const menuItems = [
    { text: 'Search', icon: <SearchIcon />, path: '/search' },
    ...(isAuthenticated
      ? [
          { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
          { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
        ]
      : []),
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <PetsIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Pet Professionals
            </Typography>

            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex' }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.firstName} src="/static/avatar.jpg" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => handleNavigation('/profile')}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box>
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Pet Professionals. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
