const User = require("../models/User")
const bcrypt = require("bcrypt");


exports.createUser = async (req, res) => {
     console.log("Request body:", req.body);
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "staff",
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      message: "User created successfully",
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const query = {
      organizationId: req.user.organizationId,
      role: "staff",
      name: { $regex: search, $options: "i" }
    };

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Staff users fetched successfully",
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};