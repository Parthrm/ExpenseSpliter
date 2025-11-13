const express = require("express");
const router = express.Router();
const { settlementsTransactions, getTripSpendingSummary } = require("../controller/reportController");

router.get("/:tripId", settlementsTransactions);
router.get("/spendings/:tripId", getTripSpendingSummary);

module.exports = router;