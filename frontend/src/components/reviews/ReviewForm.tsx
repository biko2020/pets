import React from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Rating,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

interface ReviewFormProps {
  profileId: string;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  initialValues?: ReviewFormValues;
  isEdit?: boolean;
}

export interface ReviewFormValues {
  rating: number;
  title: string;
  content: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  profileId,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const { t } = useTranslation();

  const validationSchema = Yup.object({
    rating: Yup.number()
      .required(t('validation.required'))
      .min(1, t('validation.required'))
      .max(5),
    title: Yup.string()
      .required(t('validation.required'))
      .min(3, t('validation.minLength', { count: 3 }))
      .max(100, t('validation.maxLength', { count: 100 })),
    content: Yup.string()
      .required(t('validation.required'))
      .min(10, t('validation.minLength', { count: 10 }))
      .max(1000, t('validation.maxLength', { count: 1000 })),
  });

  const defaultValues: ReviewFormValues = {
    rating: 5,
    title: '',
    content: '',
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEdit ? t('reviews.editReview') : t('reviews.writeReview')}
      </Typography>
      <Formik
        initialValues={initialValues || defaultValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            await onSubmit(values);
            if (!isEdit) {
              resetForm();
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          isSubmitting,
        }) => (
          <Form>
            <Box sx={{ mb: 2 }}>
              <Typography component="legend">{t('reviews.rating')}</Typography>
              <Rating
                name="rating"
                value={values.rating}
                onChange={(_, newValue) => {
                  setFieldValue('rating', newValue);
                }}
                precision={1}
                icon={<StarIcon fontSize="inherit" />}
                size="large"
              />
              {touched.rating && errors.rating && (
                <Typography color="error" variant="caption">
                  {errors.rating}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              name="title"
              label={t('reviews.title')}
              value={values.title}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.title && Boolean(errors.title)}
              helperText={touched.title && errors.title}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              name="content"
              label={t('reviews.content')}
              value={values.content}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.content && Boolean(errors.content)}
              helperText={touched.content && errors.content}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 1 }}
            >
              {isSubmitting
                ? t('common.submitting')
                : isEdit
                ? t('common.update')
                : t('common.submit')}
            </Button>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default ReviewForm;
