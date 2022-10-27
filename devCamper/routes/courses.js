const { Router } = require('express');
const router = Router({ mergeParams: true });

const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courses');

const Course = require('../models/Course');
const advancedResults = require('../middlewares/advance_result');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
    .get(advancedResults(Course, 'bootcamps'), getCourses)
    .post(protect, authorize('publisher', 'admin'), createCourse)
    
router.route('/:course_id')
    .get(getCourse)
    .put(protect, authorize('publisher', 'admin'), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse)

module.exports = router;
 