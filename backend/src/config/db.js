const mongoose = require('mongoose')

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("mongodb is connected")
    } catch(error){
        console.log("Error connecting to mongodb")
        process.exit(1)
    }
}
module.exports = connectDB