const express = require("express");
const {
  createTransaction,
  getAllTransactions,
  getTransactionsByTripId,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controller/transactionController");
const router = express.Router();

router.post("/", createTransaction);
router.get("/", getAllTransactions);
router.get("/trip/:tripId", getTransactionsByTripId);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
