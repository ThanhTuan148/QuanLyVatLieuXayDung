import api from './api';

const reviewService = {
    getProductReviews: (productId) => {
        return api.get(`/reviews/product/${productId}`);
    },

    checkReviewStatus: (productId, customerId, orderId) => {
        return api.get('/reviews/check-status', {
            params: { productId, customerId, orderId }
        });
    },
    
    submitReview: (reviewData) => {
        return api.post('/reviews', reviewData);
    },
    
    updateReview: (reviewId, reviewData) => {
        return api.put(`/reviews/${reviewId}`, reviewData);
    },
    
    deleteReview: (reviewId) => {
        return api.delete(`/reviews/${reviewId}`);
    }
};

export default reviewService;
