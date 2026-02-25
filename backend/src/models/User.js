// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     fullName:{ type: String, require: true},
//     email:{ type: String, require: true, unique: true},
//     password:{ type: String, require: true},
//       areYou: { 
//         type: String, 
//         required: true,
//         enum: ["patient", "doctor"] 
//     },

//     gender: { 
//         type: String, 
//         required: true,
//         enum: ["male", "female"]
//     },
// })

// module.exports = mongoose.model("User", userSchema)

const mongoose = require( "mongoose")

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: Number },
  profilePic: { type: String },
  role: {
    type: String,
    enum: ["patient", "admin","doctors"],
    default: "patient",
  },
  gender: { type: String, enum: ["male", "female", "other"] },
  bloodType: { type: String },
  // appointments: [{ type: mongoose.Types.ObjectId, ref: "Appointment" }],
});

module.exports = mongoose.model("User", UserSchema)   