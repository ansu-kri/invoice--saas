const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const permit = require("../middleware/role.middleware");
const {
    getCurrentOrganization,
    updateCurrentOrganization,
} = require("../controllers/organization.controller");

const router = express.Router();

router.route("/current")
    .get(protect, getCurrentOrganization)
    .patch(protect, permit("admin"), updateCurrentOrganization);

module.exports = router;
