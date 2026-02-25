const User = require("../Model/user");
const generateToken = require("../Configs/utils");
const bcrypt = require("bcrypt");

// ==================== SIGNUP ====================
const signup = async (req, res) => {
  try {
    // Extract fields from form data
    const { fullName, email, password, role, gender, phone = "", bloodType = "" } = req.body;

    // --- Validation ---
    if (!fullName || !email || !password || !role || !gender) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // --- Check if user exists ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create new user ---
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      gender,
      phone,
      bloodType,
      profilePic: req.file ? req.file.path : undefined,
    });

    const savedUser = await newUser.save();

    // --- Generate JWT token ---
    const token = generateToken(savedUser._id);

    // --- Send response ---
    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      profilePic: savedUser.profilePic,
      token,
    });
  } catch (error) {
    console.error("Error in signup:", error.message);
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Error in login:", error.message);
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ================user logout=======================

const logout  = async (req, res) =>  {
    try{
       return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
    }
    catch(error) {
        res.status(500).json({ success: false, message: "error.message"});
    }
}

module.exports = { signup, login, logout };