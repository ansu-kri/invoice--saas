const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth.middleware");
const permit = require("../middleware/role.middleware");
const {createUser, getUsers} = require("../controllers/user.controller")

router.post("/users", protect, permit("admin"), createUser);
router.get("/", protect, permit("admin"), getUsers)

module.exports = router;