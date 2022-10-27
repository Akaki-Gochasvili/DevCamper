const crypto = require('crypto');
const ErrorResponse = require('../utils/error_response');
const asyncHandler = require('../middlewares/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

// @desc    Register user
// @route   GET /api/v1/auth/registration
// @access  Public
exports.registration = asyncHandler(async (request, response, next) => {
    const { name, email, password, role } = request.body;

    if (request.body.role === 'admin') {
        return next(
            new ErrorResponse(
                'You are not authorize to create the user with admin role.'
            )
        )
    }

    // ============  Create User =========== //
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    sendTokenResponse(user, 200, response);
})

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (request, response, next) => {
    const { email, password } = request.body;

    // ======= Validate email & password ======= //
    if (!email || !password) {
        return next(
            new ErrorResponse('Please providde an email and password', 400)
        );
    };

    // ======= Check for user ======= //
    const user = await User.findOne({ email: email }).select('+password');

    if (!user) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        );
    };

    // ======= Check fif Password Matches ======= //
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        );
    };

    sendTokenResponse(user, 200, response);
});

// ========== Get token from model, create cookie and send response ======== //
const sendTokenResponse = (user, statusCode, response) => {
    //  ====== Create token ====== //
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    };

    response
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token: token
        })
}

// @desc    Get current logged user
// @route   PUT /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (request, response, next) => {
    User
        .findById(request.user.id)
        .then(user => {
            response
                .status(200)
                .json({
                    success: true,
                    user: user
                });
        })
        .catch(error => {
            response
                .status(400)
                .json({
                    success: false
                })
        })
})

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgotPassword
// @access  Private
exports.forgotPassword = asyncHandler(async (request, response, next) => {
    const user = await User.findOne({ email: request.body.email });

    if (!user) {
        return next(new ErrorResponse(`There is no user with this mail.`, 404));
    };

    // Get reset token 
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    //Create reset url
    const resetUrl = `${request.protocol}://${request.get('host')}/api/v1/auth/resetPassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('Email could not be sent', 500));
    }

    response
        .status(200)
        .json({
            success: true,
            message: "token sent"
        });
})

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resetToken
// @access  Private
exports.resetPassword = asyncHandler(async (request, response, next) => {
    //Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(request.params.resetToken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(
            new ErrorResponse(
                'Invalid token', 400
            )
        );
    };

    // Set new password
    user.password = request.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, response);
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updateDetails
// @access  Private
exports.updateDetails = asyncHandler(async (request, response, next) => {
    const user = await User.findByIdAndUpdate(
        request.user.id,
        {
            name: request.body.name,
            email: request.body.email
        },
        {
            new: true,
            runValidators: true
        }
    );


    response
        .status(200)
        .json(
            {
                success: true,
                data: user
            }
        );

});

// @desc    Update password
// @route   PUT /api/v1/auth/changePassword
// @access  Private
exports.changePassword = asyncHandler(async (request, response, next) => {
    const user = await User.findById(request.user.id).select('password');

    // Check current password
    if (!(await user.matchPassword(request.body.currentPassword))) {
        return next (
            new ErrorResponse (
                'Password is incorrect', 401
            )
        );
    };

    user.password = request.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, response);
});
