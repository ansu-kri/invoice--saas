const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
    createCustomer,
    deleteCustomer,
    getCustomer,
    getCustomers,
    updateCustomer,
} = require("../controllers/customer.controller");

const router = express.Router();

router.use(protect);
router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").get(getCustomer).patch(updateCustomer).delete(deleteCustomer);

module.exports = router;
