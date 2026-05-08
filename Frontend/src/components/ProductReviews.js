import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Rating,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import reviewService from '../services/reviewService';

function ProductReviews({ productId, reviews = [], avgRating = 0, userId }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        userId,
        productId,
        rating,
        comment,
        isApproved: false,
      });
      alert('Review submitted successfully! It will be displayed after approval.');
      setOpenDialog(false);
      setRating(5);
      setComment('');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Product Reviews
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="subtitle2">Average Rating</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={avgRating} readOnly precision={0.1} />
            <Typography>{avgRating.toFixed(1)}</Typography>
            <Typography variant="caption" color="textSecondary">
              ({reviews.length} reviews)
            </Typography>
          </Stack>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setOpenDialog(true)}
        >
          Write a Review
        </Button>
      </Box>

      {reviews.length === 0 ? (
        <Typography color="textSecondary">No reviews yet</Typography>
      ) : (
        <Stack spacing={2}>
          {reviews.map((review) => (
            <Card key={review.reviewId} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">{review.user?.fullName || 'Anonymous'}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(review.createdDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">{review.comment}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Review Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Rating
              </Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                size="large"
              />
            </Box>
            <TextField
              label="Your Comment"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              placeholder="Share your experience with this product..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProductReviews;
