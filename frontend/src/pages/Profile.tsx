import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  country: Yup.string().required('Country is required'),
  phone: Yup.string().required('Phone number is required'),
  website: Yup.string().url('Enter a valid URL'),
});

const businessCategories = [
  'Vets',
  'Grooming',
  'Pet Hotels',
  'Pet Transport',
  'Events',
  'Pet Products',
  'Pet Food',
  'Pet Clinics',
  'Insurance',
  'Associations',
  'Advice',
];

const Profile = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: profile, isLoading } = useQuery('profile', async () => {
    const response = await axios.get('/api/profiles/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.profile;
  });

  const updateProfile = useMutation(
    async (values: any) => {
      const response = await axios.put(
        '/api/profiles/me',
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  const uploadImage = useMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await axios.post('/api/profiles/me/image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        setSuccess('Profile image updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Failed to upload image');
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      companyName: profile?.companyName || '',
      description: profile?.description || '',
      address: profile?.address || '',
      city: profile?.city || '',
      country: profile?.country || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      categories: profile?.categories || [],
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      updateProfile.mutate(values);
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={profile?.profileImage}
                  sx={{ width: 200, height: 200, mb: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="icon-button-file"
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="icon-button-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                  >
                    Upload Photo
                  </Button>
                </label>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="companyName"
                    name="companyName"
                    label="Company Name"
                    value={formik.values.companyName}
                    onChange={formik.handleChange}
                    error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                    helperText={formik.touched.companyName && formik.errors.companyName}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    id="description"
                    name="description"
                    label="Description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Business Categories</InputLabel>
                    <Select
                      multiple
                      value={formik.values.categories}
                      onChange={formik.handleChange}
                      name="categories"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                    >
                      {businessCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="address"
                    name="address"
                    label="Address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    error={formik.touched.address && Boolean(formik.errors.address)}
                    helperText={formik.touched.address && formik.errors.address}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="city"
                    name="city"
                    label="City"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="country"
                    name="country"
                    label="Country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    error={formik.touched.country && Boolean(formik.errors.country)}
                    helperText={formik.touched.country && formik.errors.country}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label="Phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="website"
                    name="website"
                    label="Website"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                    error={formik.touched.website && Boolean(formik.errors.website)}
                    helperText={formik.touched.website && formik.errors.website}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={updateProfile.isLoading}
                  >
                    {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
