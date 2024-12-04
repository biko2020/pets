import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Rating,
  InputAdornment,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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

interface SearchFilters {
  query: string;
  category: string;
  city: string;
}

const Search = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    city: '',
  });

  const { data: searchResults, isLoading } = useQuery(
    ['searchProfiles', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);

      const response = await axios.get(`/api/profiles/search?${params.toString()}`);
      return response.data.profiles;
    },
    {
      enabled: !!(filters.query || filters.category || filters.city),
    }
  );

  const handleFilterChange = (field: keyof SearchFilters) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const ProfileCard = ({ profile }: { profile: any }) => (
    <Card sx={{ display: 'flex', mb: 2 }}>
      <CardMedia
        component="img"
        sx={{ width: 200, objectFit: 'cover' }}
        image={profile.profileImage || '/static/default-business.jpg'}
        alt={profile.companyName}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box>
              <Typography variant="h5" component="div">
                {profile.companyName}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Rating value={profile.rating} readOnly precision={0.5} size="small" />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  ({profile.reviewCount} {t('reviews')})
                </Typography>
              </Box>
            </Box>
            <Box>
              {profile.categories.map((category: string) => (
                <Chip
                  key={category}
                  label={t(category.toLowerCase())}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {profile.description}
          </Typography>

          <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center">
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" ml={1}>
                {profile.city}, {profile.country}
              </Typography>
            </Box>
            {profile.phone && (
              <Box display="flex" alignItems="center">
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  {profile.phone}
                </Typography>
              </Box>
            )}
            {profile.website && (
              <Box display="flex" alignItems="center">
                <LanguageIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  {profile.website}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Box>
    </Card>
  );

  return (
    <Container>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('search.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('search.subtitle')}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('search.searchPlaceholder')}
              value={filters.query}
              onChange={handleFilterChange('query')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('search.category')}</InputLabel>
              <Select
                value={filters.category}
                onChange={handleFilterChange('category')}
                label={t('search.category')}
              >
                <MenuItem value="">
                  <em>{t('search.allCategories')}</em>
                </MenuItem>
                {businessCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {t(`categories.${category.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('search.city')}
              value={filters.city}
              onChange={handleFilterChange('city')}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
            >
              {t('search.searchButton')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : searchResults?.length ? (
        <Box>
          {searchResults.map((profile: any) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </Box>
      ) : (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            {t('search.noResults')}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Search;
