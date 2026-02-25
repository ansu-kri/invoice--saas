const User = require("../Model/user");


const getAlldoctors = async (req, res) => {
    try{
    const doctors = await User
      .find({ role: "doctors" }) 
      .select("-password");
        res.status(200).json({ success: true, count: doctors.length, data: doctors})
    }
    catch(error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = getAlldoctors;