const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const permit = require("../middleware/role.middleware");
const {
    createExpense,
    deleteExpense,
    getExpenses,
    updateExpense,
} = require("../controllers/expense.controller");

const router = express.Router();

router.use(protect);
router.route("/").get(getExpenses).post(permit("admin", "staff"), createExpense);
router.route("/:id")
    .patch(permit("admin", "staff"), updateExpense)
    .delete(permit("admin"), deleteExpense);

module.exports = router;
