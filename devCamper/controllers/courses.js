const ErrorResponse = require('../utils/error_response');
const asyncHandler = require('../middlewares/async');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get Courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcamp_id/courses
// @access  Public
exports.getCourses = asyncHandler(async (request, response, next) => {
    if (request.params.bootcamp_id) {
        await Course
            .find({ bootcamp: request.params.bootcamp_id })
            .populate({
                path: 'bootcamp',
                select: 'name description'
            })
            .then(courses => {
                response
                    .status(200)
                    .json({
                        success: true,
                        count: courses.length,
                        courses: courses
                    });
            })
            .catch(error => {
                next(error)
            });
    } else {
        response
            .status(200)
            .json(response.advancedResults)
            .catch(error => {
                next(error);
            })
    }
});

// @desc    Get Courses
// @route   GET /api/v1/courses/:course_id
// @access  Public
exports.getCourse = asyncHandler(async (request, response, next) => {
    await Course
        .findById(request.params.course_id)
        .populate({
            path: 'bootcamp',
            select: 'name description'
        })
        .then(course => {
            if (!course) {
                return next(new ErrorResponse(`Course not found with ID of ${request.params.course_id}`, 404));
            }

            response
                .status(200)
                .json({
                    success: true,
                    course: course
                });
        })
        .catch(error => {
            next(error)
        });
});

// @desc    Create new Course
// @route   POST /api/v1/bootcamps/:bootacmp_id/courses
// @access  Private
exports.createCourse = asyncHandler(async (request, response, next) => {
    request.body.bootcamp = request.params.bootcamp_id;
    request.body.user = request.user.id;


    const bootcamp = await Bootcamp.findById(request.params.bootcamp_id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`No Bootcamp with the id of ${request.params.bootcamp_id}`), 404
        );
    };

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.user.id} is not authorized add a course to ${bootcamp._id}`,
                401
            )
        );
    };


    await Course
        .create(request.body)
        .then(new_course => {
            response
                .status(201)
                .json({
                    success: true,
                    new_course: new_course
                });
        })
        .catch(error => {
            next(error);
        });
});

// @desc    Update a Course by ID
// @route   GET /api/v1/courses/:course_id
// @access  Private
exports.updateCourse = asyncHandler(async (request, response, next) => {
    let course = await Course.findById(request.params.id);

    if (!course) {
        return next(new ErrorResponse(`Course not found with ID of ${request.params.course_id}`, 404));
    }

    // Make sure user is course owner
    if (course.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.user.id} is not authorized to update course ${course._id}`,
                401
            )
        );
    };


    await Course
        .findByIdAndUpdate(
            request.params.course_id,
            request.body,
            {
                new: true,
                runValidators: true
            }
        )
        .then(updated_course => {
            response
                .status(200)
                .json({
                    succes: true,
                    updated_course: updated_course
                });
        })
        .catch(error => {
            next(error);
        });
});

// @desc    Delete a Course
// @route   DELETE /api/v1/courses/:course_id
// @access  Private
exports.deleteCourse = asyncHandler(async (request, response, next) => {
    const course = await Course.findById(request.params.bootcamp_id)

    if (!course) {
        new ErrorResponse(`Course not found with id of ${request.params.course_id}`)
    }

    // Make sure user is course owner
    if (course.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.user.id} is not authorized to delete course ${course._id}`,
                401
            )
        );
    };

    course
        .remove()
        .then(() => {
            response
                .status(200)
                .json({
                    success: true
                });
        })
        .catch(error => {
            next(error);
        });
});