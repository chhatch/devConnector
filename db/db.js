const mongoose = require('mongoose')
const mongoURI = process.env.MONGODB_URL
const options = {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    keepAlive: true, 
    keepAliveInitialDelay: 300000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
}

const connectDB = async () => {
    try{
        await mongoose.connect(mongoURI, options)
    }
    catch(e) {
        console.error(e.message)
        process.exit(1)
    }
}

module.exports = connectDB
