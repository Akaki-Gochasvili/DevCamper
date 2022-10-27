const fs = require('fs');
const mongoose = require('mongoose');
const chalk = require('chalk');
const dotenv = require('dotenv');
const connectDB = require('./config/MongoDb');

// ========== Load ENV variables ========== //
dotenv.config({ path: './config/config.env' });

// ========== Load Models ========== //
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const User = require('./models/User');

// ========== Connect to MongoDB ========== //
connectDB();

// ========== Read JSON files ========== //
const bootcamps = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8')
);

const courses = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8')
);

const users = JSON.parse(
    fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

// ========== Import data into DB ========== //
const importData = async () => {
    try {
        await Bootcamp.create(bootcamps);
        await Course.create(courses);
        await User.create(users);

        console.log(chalk.green.inverse('Data Imported...'));
        process.exit();
    } catch (error) {
        console.error(error)
    }
};

// ========== Delte data from DB ========== //
const deleteData = async () => {
    try {
        await Bootcamp.deleteMany();
        await Course.deleteMany();
        await User.deleteMany();

        console.log(chalk.red.inverse('Data destroyed...'));
        process.exit();
    } catch (error) {
        console.error(error)
    };
};

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
};
