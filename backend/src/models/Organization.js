const mongoose = require("mongoose")

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
},
    { timestamps: true }
);
module.exports = mongoose.model("Organization",organizationSchema)
