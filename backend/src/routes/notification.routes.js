const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} = require("../controllers/notification.controller");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
