const transactionModel = require("../models/transactionModel.js");
const validMongooseId = require("../utils/validMongooseId.js");

// ---------- Helper Functions ----------
const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message });
};

const validateTransactionData = ({ amount, paidBy, tripId, contribution }) => {
  if (amount == null || isNaN(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative number.");
  }
  
  if (!tripId || !validMongooseId(tripId)) throw new Error("Field 'tripId' not found or is invalid.");
  if (!paidBy || !validMongooseId(paidBy)) throw new Error("Field 'paidBy' not found or is invalid.");

  if (!Array.isArray(contribution) || contribution.length === 0) {
    throw new Error("Contribution must be a non-empty array.");
  }

  const invalidEntry = contribution.find(
    (c) => !c.userId || !validMongooseId(c.userId) || c.amount == null || isNaN(c.amount) || c.amount < 0
  );
  if (invalidEntry) {
    throw new Error("Each contribution entry must have a valid userId and non-negative amount.");
  }
};

// ---------- Handlers ----------

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { amount, description, paidBy, tripId, contribution } = req.body;

    validateTransactionData({ amount, paidBy, tripId, contribution });

    const transaction = await transactionModel.create({
      amount,
      description: description?.trim() || "",
      paidBy,
      tripId,
      contribution
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully!",
      data: transaction
    });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await transactionModel.find({})
      .populate("paidBy", "name phoneNo")
      .populate("tripId", "name")
      .populate("contribution.userId", "name phoneNo")
      .select(["_id", "amount", "description", "paidBy", "tripId", "contribution", "createdAt"]);

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    sendError(res, 500, "Error fetching transactions."+error.message);
  }
};

// Get single transaction
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await transactionModel.findById(id)
      .populate("paidBy", "name phoneNo")
      .populate("tripId", "name")
      .populate("contribution.userId", "name phoneNo");

    if (!transaction) {
      return sendError(res, 404, "Transaction not found.");
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    sendError(res, 400, "Invalid transaction ID.");
  }
};

// Update a transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, paidBy, tripId, contribution } = req.body;

    const existing = await transactionModel.findById(id);
    if (!existing) {
      return sendError(res, 404, "Transaction not found.");
    }

    // Optional: validate only if fields are present
    if (amount != null || paidBy || tripId || contribution) {
      validateTransactionData({
        amount: amount ?? existing.amount,
        paidBy: paidBy ?? existing.paidBy,
        tripId: tripId ?? existing.tripId,
        contribution: contribution ?? existing.contribution
      });
    }

    existing.amount = amount ?? existing.amount;
    existing.description = description?.trim() ?? existing.description;
    existing.paidBy = paidBy ?? existing.paidBy;
    existing.tripId = tripId ?? existing.tripId;
    existing.contribution = contribution ?? existing.contribution;

    await existing.save();

    res.status(200).json({ success: true, message: "Transaction updated successfully!", data: existing });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await transactionModel.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 404, "Transaction not found.");
    }

    res.status(200).json({ success: true, message: "Transaction deleted successfully!" });
  } catch (error) {
    sendError(res, 400, "Invalid transaction ID.");
  }
};

// Get all transactions for a specific trip
const getTransactionsByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
        return sendError(res, 400, "Trip ID is required.");
    }
    if (!validMongooseId(tripId)) {
        return sendError(res, 400, "Invalid Trip ID format."); 
    }

    const transactions = await transactionModel.find({ tripId })
      .populate("paidBy", "name phoneNo")
      .populate("tripId", "name")
      .populate("contribution.userId", "name phoneNo")
      .select(["_id", "amount", "description", "paidBy", "tripId", "contribution", "createdAt"]);
    
    if (transactions.length === 0) {
      return sendError(res, 404, "No transactions found for this trip.");
    }

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    sendError(res, 400, "Invalid trip ID or database error: "+error.message);
  }
};

module.exports = {createTransaction,getAllTransactions,getTransactionById,updateTransaction,deleteTransaction,getTransactionsByTripId};
