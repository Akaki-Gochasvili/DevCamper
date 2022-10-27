const { Router } = require('express');
const router = Router({ mergeParams: true });

const {
    getReviews, getReview, addReview, updateReview, deleteReview
} = require('../controllers/reviews');

const Review = require('../models/Review');
const advancedResults = require('../middlewares/advance_result');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
    .get(advancedResults(Review, { path: 'bootcamp', select: 'name description' }), getReviews)

router
    .route('/:id')
    .get(getReview)
    .put(protect, authorize('user', 'admin'), updateReview)
    .delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;
