const { Schema, model, Types } = require('mongoose');

const CourseSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            required: [true, 'Please add a course title']
        },
        description: {
            type: String,
            required: [true, 'Please add a description']
        },
        weeks: {
            type: Number,
            required: [true, 'Please add number weeks']
        },
        tuition: {
            type: Number,
            required: [true, 'Please add a tuition cost']
        },
        minimumSkill: {
            type: String,
            required: [true, 'Please add a minimum skill'],
            enum: ['beginner', 'intermediate', 'advanced']
        },
        scholarshipAvailable: {
            type: Boolean,
            default: false
        },
        bootcamp: {
            type: Schema.ObjectId,
            ref: 'Bootcamp',
            required: [true, 'Please add a bootcamp ID']
        },
        user: {
            type: Schema.ObjectId,
            ref: 'User',
            required: [true, 'Please add an user ID']
        }
    },
    { timestamps: true }
);

CourseSchema.statics.getAverageCost = async function (bootcampId) {
    const averageCost = await this.aggregate(
        [
            {
                $match: {
                    bootcamp: bootcampId
                }
            },
            {
                $group: {
                    _id: '$bootcamp',
                    averageCost: {$avg: '$tuition'}
                }
            }
        ]
    )

    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(averageCost[0].averageCost / 10) * 10
        });
    } catch (error) {
        console.log(error)
    }
}

CourseSchema.post('save', function () {
    this.constructor.getAverageCost(Types.ObjectId(this.bootcamp))
})

CourseSchema.pre('remove', function() {
    this.constructor.getAverageCost(Types.ObjectId(this.bootcamp))
})


module.exports = model('Course', CourseSchema);
