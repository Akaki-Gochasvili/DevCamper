const mongoose = require('mongoose');
const chalk = require('chalk');

const connectDB = async () => {
    try {
        const connect = await mongoose
            .connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useCreateIndex: true,
                useFindAndModify: false,
                useUnifiedTopology: true
            })

        console.log(chalk.bold.yellow(`MongoDb Connected: ${connect.connection.host}`));
    } catch (error) {
        console.log(`ERROR: ${error}`)
    }


}

module.exports = connectDB;