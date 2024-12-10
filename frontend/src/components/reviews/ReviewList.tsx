import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Button,
  Divider,
  Stack,
  Pagination,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  response?: string;
  responseDate?: string;
}

interface ReviewListProps {
  reviews: Review[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  isProfileOwner?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  totalPages,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  onRespond,
  isProfileOwner = false,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  return (
    <Box>
      <Stack spacing={2}>
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Rating value={review.rating} readOnly precision={0.5} size="small" />
                  <Typography variant="h6">{review.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('reviews.by')} {review.user.firstName} {review.user.lastName} •{' '}
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
                {user && user.id !== null && user.id === review.user.id && (
                  <Box>
                    <Button
                      size="small"
                      onClick={() => onEdit && onEdit(review)}
                      sx={{ mr: 1 }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onDelete && onDelete(review.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </Box>
                )}
              </Box>

              <Typography variant="body1" paragraph>
                {review.content}
              </Typography>

              {review.response && (
                <Box mt={2} bgcolor="action.hover" p={2} borderRadius={1}>
                  <Typography variant="subtitle2" color="primary">
                    {t('reviews.businessResponse')}
                  </Typography>
                  <Typography variant="body2">
                    {review.response}
                  </Typography>
                  {review.responseDate && (
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })}
                    </Typography>
                  )}
                </Box>
              )}

              {isProfileOwner && !review.response && (
                <Box mt={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const response = prompt(t('reviews.enterResponse'));
                      if (response && onRespond) {
                        onRespond(review.id, response);
                      }
                    }}
                  >
                    {t('reviews.respond')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default ReviewList;
