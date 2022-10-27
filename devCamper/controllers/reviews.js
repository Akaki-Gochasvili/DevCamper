const ErrorResponse = require('../utils/error_response');
const asyncHandler = require('../middlewares/async');
const Bootcamp = require('../models/Bootcamp');
const Review = require('../models/Review');

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcamp_id/reviews
// @access  Public
exports.getReviews = asyncHandler(async (request, response, next) => {
    if (request.params.bootcamp_id) {
        const reviews = await Review.find({ bootcamp: request.params.bootcamp_id })

        return response
            .status(200)
            .json(
                {
                    success: ture,
                    count: reviews.length,
                    reviews
                }
            )
            .catch(error => {
                next(error);
            })
    } else {
        response
            .status(200)
            .json(response.advancedResults)
            .catch(error => {
                next(error);
            })
    }
});

// @desc      Get single review
// @route     GET /api/v1/reviews/:id
// @access    Public
exports.getReview = asyncHandler(async (request, response, next) => {
    const review = await Review.findById(request.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    });

    if (!review) {
        return next(
            new ErrorResponse(`No review found with the id of ${request.params.id}`, 404)
        );
    }

    response.status(200).json({
        success: true,
        review: review
    });
});

// @desc      Add review
// @route     POST /api/v1/bootcamps/:bootcamp_id/reviews
// @access    Private
exports.addReview = asyncHandler(async (request, response, next) => {
    request.body.bootcamp = request.params.bootcamp_id;
    request.body.user = request.user.id;

    const bootcamp = await Bootcamp.findById(request.params.bootcamp_id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(
                `No bootcamp with the id of ${request.params.bootcamp_id}`,
                404
            )
        );
    }

    const review = await Review.create(request.body);

    response.status(201).json({
        success: true,
        review: review
    });
});

// @desc      Update review
// @route     PUT /api/v1/reviews/:id
// @access    Private
exports.updateReview = asyncHandler(async (request, response, next) => {
    let review = await Review.findById(request.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No review with the id of ${request.params.id}`, 404)
        );
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review`, 401));
    }

    review = await Review.findByIdAndUpdate(request.params.id, request.body, {
        new: true,
        runValidators: true
    });


    response.status(200).json({
        success: true,
        review: review
    });
});

// @desc      Delete review
// @route     DELETE /api/v1/reviews/:id
// @access    Private
exports.deleteReview = asyncHandler(async (request, response, next) => {
    const review = await Review.findById(request.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No review with the id of ${request.params.id}`, 404)
        );
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review`, 401));
    }

    await review.remove();

    response.status(200).json({
        success: true
    });
});
