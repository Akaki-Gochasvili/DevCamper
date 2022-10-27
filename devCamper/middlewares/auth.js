const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/error_response");
const User = require("../models/User");

// =========== Protect Routes =========== //
exports.protect = asyncHandler(async (request, response, next) => {
    let token;

    if (
        request.headers.authorization &&
        request.headers.authorization.startsWith("Bearer")
    ) {
        token = request.headers.authorization.split(" ")[1];
    }
    else if (request.cookies.token) {
        token = request.cookies.token
    }

    // ====== Make Sure token exists ====== //
    if (!token) {
        return next(
            new ErrorResponse("Not authorized to access this route", 401)
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log(decoded);

        request.user = await User.findById(decoded.id);

        next();
    } catch (error) {
        return next(
            new ErrorResponse("Not authorized to access this route", 401)
        );
    }
});

// ======== Grant access to specific roles ======== //
exports.authorize = (...roles) => {
    return (request, response, next) => {
        if (!roles.includes(request.user.role)) {
            return next(
                new ErrorResponse(
                    `User role ${request.user.role} is not authorized to access this route`,
                    403
                )
            );
        }
        next();
    };
};
