const mongoose = require( "mongoose")

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin","member"],
    default: "member",
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  }
},{timestamps: true});

module.exports = mongoose.model("User", UserSchema)   