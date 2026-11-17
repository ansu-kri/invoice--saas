const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/auth.middleware");
const permit = require("../middleware/role.middleware");
const {createUser, getUsers, deleteUser, getProfile, updateProfile, changePassword} = require("../controllers/user.controller")

router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);
router.patch("/me/password", protect, changePassword);
router.post("/users", protect, permit("admin"), createUser);
router.get("/", protect, permit("admin"), getUsers)
router.delete("/:id", protect, permit("admin"), deleteUser)

module.exports = router;