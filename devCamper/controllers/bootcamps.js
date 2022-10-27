const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/error_response');
const geocoder = require('../utils/geocoder');
const asyncHandler = require('../middlewares/async');

// @desc    Get all Bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (request, response, next) => {
    response
        .status(200)
        .json(response.advancedResults)
        .catch(error => {
            next(error);
        })
});

// @desc    Get a single bootcamp by ID
// @route   GET /api/v1/bootcamps/:bootcamp_id
// @access  Public
exports.getBootcamp = asyncHandler(async (request, response, next) => {
    await Bootcamp
        .findById(request.params.bootcamp_id)
        .then(bootcamp => {
            if (!bootcamp) {
                return next(new ErrorResponse(`Bootcamp not found with ID of ${request.params.bootcamp_id}`, 404));
            }

            response
                .status(200)
                .json({
                    success: true,
                    bootcamp: bootcamp
                });
        })
        .catch(error => {
            next(error)
        });
});

// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async (request, response, next) => {
    //  Add user to request.body 
    request.body.user = request.user.id;

    // Chech for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: request.user.id });

    // If the user is not an admin they can only add one bootcamp
    if (publishedBootcamp && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `The user with ID ${request.user.id} has already published a bootcamp`,
                400
            )
        );

    };

    await Bootcamp
        .create(request.body)
        .then(new_bootcamp => {
            response
                .status(201)
                .json({
                    success: true,
                    new_bootcamp: new_bootcamp
                });
        })
        .catch(error => {
            next(error);
        });
});

// @desc    Update a bootcamp by ID
// @route   GET /api/v1/bootcamps/:bootcamp_id
// @access  Private
exports.updateBootcamp = asyncHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(
        request.params.bootcamp_id
    )

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with ID of ${request.params.bootcamp_id}`, 404));
    }

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.params.bootcamp_id} is not authorized to update this bootcamp`,
                401
            )
        );
    };

    await Bootcamp
        .findByIdAndUpdate(
            request.params.bootcamp_id,
            request.body,
            {
                new: true,
                runValidators: true
            }
        )
        .then(updated_bootcamp => {
            response
                .status(200)
                .json({
                    succes: true,
                    updated_bootcamp: updated_bootcamp
                });
        })
        .catch(error => {
            next(error);
        });
});

// @desc    Delete a bootcamp
// @route   DELETE /api/v1/bootcamps/:bootcamp_id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(request.params.bootcamp_id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${request.params.bootcamp_id}`, 404)
        );
    };

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.params.bootcamp_id} is not authorized to remove this bootcamp`,
                401
            )
        );
    };

    bootcamp
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
        })
});

// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
exports.getBootcampsInRadius = asyncHandler(async (request, response, next) => {
    const { zipcode, distance } = request.params;

    // Get lat/lng from geocoder
    await geocoder
        .geocode(zipcode)
        .then(async (loc) => {
            const lat = loc[0].latitude;
            const lng = loc[0].longitude;

            // Calc radius using radians
            // Divide dist by radius of Earth
            // Earth Radius = 3,963 mi / 6,378 km
            const radius = distance / 3963;

            await Bootcamp
                .find({ location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } })
                .then(bootcamps => {
                    response.status(200).json({
                        success: true,
                        count: bootcamps.length,
                        bootcamps: bootcamps
                    });
                })
                .catch(error => {
                    next(error);
                });
        })
        .catch(error => {
            next(error);
        });
});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:bootcamp_id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (request, response, next) => {
    const bootcamp = await Bootcamp.findById(request.params.bootcamp_id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${request.params.bootcamp_id}`, 404)
        );
    };

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== request.user.id && request.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${request.params.bootcamp_id} is not authorized to remove this bootcamp`,
                401
            )
        );
    };

    if (!request.files) {
        return next(
            new ErrorResponse(`Please upload a file`, 400)
        );
    };

    const file = request.files.undefined;

    // ========= Make sure the file is image ======= //
    if (!file.mimetype.startsWith('image')) {
        return next(
            new ErrorResponse(`Please upload an image file`, 400)
        );
    };

    // ========= Check file's size ======= //
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400)
        );
    };

    // ========= Create custom filename ======= //
    file.name = `photo_${bootcamp._id}.${file.name.split('.')[file.name.split('.').length - 1]}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async error => {
        if (error) {
            console.error(error);
            return next(
                new ErrorResponse(
                    `Problem with file upload`, 500
                )
            )
        };

        await Bootcamp
            .findByIdAndUpdate(
                request.params.bootcamp_id,
                { photo: file.name }
            )
            .then(updated_bootcamp => {
                response
                    .status(200)
                    .json({
                        success: true,
                        updated_bootcamp: updated_bootcamp
                    })
            })
    });
});

