const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth.middleware");
const permit = require("../middleware/role.middleware");
const {createUser} = require("../controllers/user.controller")

router.post("/users", protect, permit("admin"), createUser);

module.exports = router;