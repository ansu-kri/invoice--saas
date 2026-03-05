const User = require("../models/User")
const Organization = require("../models/Organization")
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");

// ==================== SIGNUP ====================
exports.register = async (req, res) => {
  try {
    const { name, email, password, organizationName } = req.body;

    // Validate input
    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1 Create user without organizationId, skip validation
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    await newUser.save({ validateBeforeSave: false }); // skip organizationId validation

    // 2 Create organization with ownerId
    const organization = await Organization.create({
      name: organizationName,
      ownerId: newUser._id,
    });

    // 3 Update user with organizationId and save normally
    newUser.organizationId = organization._id;
    await newUser.save(); // now validation runs

    // 4 Generate JWT token
    const token = generateToken(newUser._id);

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successfu",
      token,
      user:{
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error("Error in login:", error.message);
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ================user logout=======================

exports.logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
  catch (error) {
    res.status(500).json({ success: false, message: "error.message" });
  }
}
