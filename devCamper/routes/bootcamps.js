const { Router } = require('express');
const router = Router();

const {
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
} = require('../controllers/bootcamps');

const {
    getReviews, addReview
} = require('../controllers/reviews');

const Bootcamp = require('../models/Bootcamp');
const Review = require('../models/Review');
const advancedResults = require('../middlewares/advance_result');

// ========== Include other resourse routers ========== //
const courseRouter = require('./courses');

const { protect, authorize } = require('../middlewares/auth');

// ========== Re-route into other resource routers ========== //
router.use('/:bootcamp_id/courses', courseRouter);

router.route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp);

router.route('/:bootcamp_id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

router.route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius);

router.route('/:bootcamp_id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router.route('/:bootcamp_id/reviews')
    .get(advancedResults(Review, { path: 'bootcamp', select: 'name description' }), getReviews)
    .post(protect, authorize('user', 'admin'), addReview);

module.exports = router;
