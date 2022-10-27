const ErrorResponse = require('../utils/error_response');
const asyncHandler = require('../middlewares/async');
const User = require('../models/User');

// @desc        Get all users 
// @route       GET /api/v1/auth/users 
// @access      Private/Admin
exports.getUsers = asyncHandler(async (request, response, next) => {
    response
        .status(200)
        .json(response.advancedResults);
});

// @desc        Get single users 
// @route       GET /api/v1/auth/users/:id
// @access      Private/Admin
exports.getUser = asyncHandler(async (request, response, next) => {
    const user = await User.findById(request.params.id);

    if (!user) {
        return next(
            new ErrorResponse(
                `User not found by ID ${request.params.id}`
            )
        )
    }

    response
        .status(200)
        .json(
            {
                success: true,
                user: user
            }
        )
});

// @desc        Create User
// @route       POST /api/v1/auth/users 
// @access      Private/Admin
exports.createUser = asyncHandler(async (request, response, next) => {
    const { name, email, password, role } = request.body;

    // ============  Create User =========== //
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    response
        .status(200)
        .json(
            {
                success: true,
                user: user
            }
        )
});

// @desc        Update User
// @route       PUY /api/v1/auth/users/:id
// @access      Private/Admin
exports.updateUser = asyncHandler(async (request, response, next) => {
    const user = User.findById(request.params.id);

    if (!user) {
        return next(
            new ErrorResponse(
                `User not found by ID ${request.params.id}`
            )
        )
    }

    User
        .findByIdAndUpdate(
            request.params.id,
            request.body,
            {
                new: true,
                runValidators: true,
            }
        )
        .then(updated_user => {
            response
                .status(200)
                .json(
                    {
                        success: true,
                        updated_user
                    }
                )
        })
        .catch(error => {
            next(error)
        })
});

// @desc        Delete User
// @route       DELETE /api/v1/auth/users/:id
// @access      Private/Admin
exports.deleteUser = asyncHandler(async (request, response, next) => {
    const user = await User.findById(request.params.id);

    if (!user) {
        return next(
            new ErrorResponse(
                `User not found by ID ${request.params.id}`
            )
        )
    }

    user
        .remove()
        .then(() => {
            response
                .status(200)
                .json(
                    {
                        success: true
                    }
                )
        });
});
