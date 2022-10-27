const { Router } = require('express');
const {
    registration,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    changePassword
} = require('../controllers/auth');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/users');

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advance_result');
const User = require('../models/User');

const router = Router();

router.route('/registration').post(registration);

router.route('/login').post(login);

router.route('/me').get(protect, getMe);

router.route('/forgotPassword').post(forgotPassword);

router.route('/resetPassword/:resetToken').put(resetPassword);

router.route('/updateDetails').put(protect, updateDetails)

router.route('/changePassword').put(protect, changePassword)

// ADMIN CRUD
router.route('/users').get(protect, authorize('admin'), advancedResults(User), getUsers);

router.route('/users/:id').get(protect, authorize('admin'), getUser);

router.route('/users').post(protect, authorize('admin'), createUser);

router.route('/user/:id').put(protect, authorize('admin'), updateUser);

router.route('/user/:id').delete(protect, authorize('admin'), deleteUser);

module.exports = router;
