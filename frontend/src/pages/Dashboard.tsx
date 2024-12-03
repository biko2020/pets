import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  id: string;
  companyName: string;
  description: string;
  address: string;
  city: string;
  country: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  profileImage: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { data: profile, isLoading } = useQuery<ProfileData>(
    'profile',
    async () => {
      const response = await axios.get('/api/profiles/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.profile;
    }
  );

  const { data: stats } = useQuery(
    'profileStats',
    async () => {
      const response = await axios.get('/api/profiles/me/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" component="div" ml={1}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" align="center">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate('/profile')}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Box
                component="img"
                src={profile?.profileImage || '/static/default-profile.png'}
                alt="Profile"
                sx={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  mb: 2,
                }}
              />
              <Typography variant="h5" component="div" gutterBottom>
                {profile?.companyName}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <LocationIcon sx={{ mr: 1 }} color="action" />
                <Typography variant="body1" color="text.secondary">
                  {profile?.city}, {profile?.country}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Business Type"
                  secondary={profile?.categories.join(', ')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Rating"
                  secondary={`${profile?.rating} (${profile?.reviewCount} reviews)`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Profile Views"
                value={stats?.viewsThisMonth || 0}
                icon={<VisibilityIcon color="primary" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Total Reviews"
                value={profile?.reviewCount || 0}
                icon={<StarIcon color="primary" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <List>
                    {stats?.recentActivity?.map((activity: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={activity.description}
                          secondary={new Date(activity.date).toLocaleDateString()}
                        />
                      </ListItem>
                    )) || (
                      <ListItem>
                        <ListItemText primary="No recent activity" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    View All Activity
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
