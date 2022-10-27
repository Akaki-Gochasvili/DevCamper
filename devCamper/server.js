const express = require('express');
const dotenv = require('dotenv');
const chalk = require('chalk');
const path = require('path');
const morgan = require('morgan');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error_handler');
const connectDB = require('./config/MongoDb');
const sanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// ============ Load env vars   ============ //
dotenv.config({ path: './config/config.env' });

// ============ Connect to database ============ //
connectDB();

// ============ Application Variable  ============ //
const app = express();

// ============ Body parser ============ //
app.use(express.json());

app.use(cookieParser());

// =========== Development Logging Middleware =========== //
if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'));
};

// ========== File Uploading ========== //
app.use(fileupload());

// ========== Sanitize Data ========= //
app.use(sanitize());

// ========== Set Security Headers ========= //
app.use(helmet());

// ========= Prevent XSS attacks ========== //
app.use(xss());

//  ========= Enable cors ======== //
app.use(cors());

// ========== Rate Limiting ======== //
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100
});

app.use(limiter);

//  ========== Prevent http param pollution ======== //
app.use(hpp())

// ========== Set static folder ========== //
app.use(express.static(path.join(__dirname, 'public')));

// ========== Appliaction Routers ========== //
app.use('/api/v1/bootcamps', require('./routes/bootcamps'));
app.use('/api/v1/courses', require('./routes/courses'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/reviews', require('./routes/reviews'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(chalk.bold.cyan(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)));

process.on('unhandledRejection', (error, promise) => {
    console.log(chalk.red(`Error: ${error.message}`))
    
    // server.close(() => process.exit(1))
});
