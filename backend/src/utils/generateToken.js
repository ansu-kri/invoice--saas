// const jwt = require("jsonwebtoken")

// const generateToken = (userID, res)=>{
//     const token = jwt.sign({userID},process.env.JWT_SECRET,{
//         expiresIn:"7d"
//     })
//     res.cookie("jwt",token,{
//         maxAge:7*24*60*60*1000,
//         httpOnly:true,
//         sameSite:"strict",
//         secure:process.env.NODE_ENV === "development" ? false : true,
//     })

//====OR=== for localhost
// res.cookie("jwt", token, {
//   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   httpOnly: true,                   // prevents JS access
//   secure: false,                     // must be false on localhost
//   sameSite: "lax",                   // allows cookie to work on different localhost ports
// });
//     return token
// }

// module.exports = generateToken;

const jwt = require("jsonwebtoken");

const generateToken = (userID) => {
  return jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = generateToken;
