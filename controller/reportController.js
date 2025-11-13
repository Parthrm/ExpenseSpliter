const validMongooseId = require("../utils/validMongooseId");
const transactionModel = require("../models/transactionModel.js");
const userModel = require("../models/userModel.js");

const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message });
};

function minTransactionCalculator(transactions) {  
  // --- Step 1: Compute net balances ---
  const balances = {};

  for (const txn of transactions) {
    const { paidBy, amount, contribution } = txn;
    // Sum of contributed amounts
    // const totalContributed = contribution.reduce((sum, c) => sum + c.amount, 0);

    // Ignore the part the paidBy paid for themself (amount - totalContributed)
    for (const { userId, amount: contribAmount } of contribution) {
      if (userId === paidBy) continue; // contributor paying themselves → skip
      balances[userId] = (balances[userId] || 0) - contribAmount; // owes
      balances[paidBy] = (balances[paidBy] || 0) + contribAmount;   // receives
    }
  }

  // Round balances
  for (const p in balances) {
    balances[p] = Number(balances[p].toFixed(2));
  }

  // --- Helper functions for minimum cash flow ---
  function getMaxCreditor(balances) {
    return Object.keys(balances).reduce((a, b) =>
      balances[a] > balances[b] ? a : b
    );
  }

  function getMaxDebtor(balances) {
    return Object.keys(balances).reduce((a, b) =>
      balances[a] < balances[b] ? a : b
    );
  }

  function allSettled(balances) {
    return Object.values(balances).every((v) => Math.abs(v) < 1e-6);
  }

  // --- Main recursive function ---
  function minCashFlow(balances) {
    const settlements = [];
    if (allSettled(balances)) return settlements;

    const debtor = getMaxDebtor(balances);
    const creditor = getMaxCreditor(balances);
    const amount = Math.min(-balances[debtor], balances[creditor]);
    const roundedAmt = Number(amount.toFixed(2));

    settlements.push({ from: debtor, to: creditor, amount: roundedAmt });

    balances[debtor] += roundedAmt;
    balances[creditor] -= roundedAmt;

    return settlements.concat(minCashFlow(balances));
  }

  // --- Step 2: Compute settlements ---
  const settlements = minCashFlow({ ...balances });

  return {balances,settlements}
}

const settlementsTransactions = async (req,res) => {
  try {
      const { tripId } = req.params;
  
      if (!tripId) {
          return sendError(res, 400, "Trip ID is required.");
      }
      if (!validMongooseId(tripId)) {
          return sendError(res, 400, "Invalid Trip ID format."); 
      }
  
      const transactions = await transactionModel.find({ tripId })
        .select(["amount", "paidBy", "contribution"]);
      
      if (transactions.length === 0) {
        return sendError(res, 404, "No transactions found for this trip.");
      }

      const data = minTransactionCalculator(transactions);
      
      const balancesByName = {};
      for(const userId in data.balances){
        const userName = await userModel.findById(userId);
        if(userName){
          balancesByName[userName.name]=data.balances[userId];
        }
      }
      const updatedSettlements = await Promise.all(
        data.settlements.map(async(obj) => {
          // Fetch both users concurrently for better performance
          const [fromUser, toUser] = await Promise.all([
            userModel.findById(obj['from']),
            userModel.findById(obj['to'])
          ]);
          
          // Handle cases where a user might not be found
          const fromName = fromUser ? fromUser.name : `User Not Found (${obj['from']})`;
          const toName = toUser ? toUser.name : `User Not Found (${obj['to']})`;

          return {
            from: fromName,
            to: toName,
            amount: obj['amount']
          };
        })
      );
        
      res.status(200)
        .json({
          success: true,
          data: { balances: balancesByName, settlements: updatedSettlements },
        });
    } catch (error) {
      sendError(res, 400, "Invalid trip ID or database error: "+error.message);
    }
}


const getTripSpendingSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return sendError(res,400,"Trip ID is required.");
    }

    // 1️⃣ Fetch all transactions for this trip
    const transactions = await transactionModel.find({ tripId })
      .populate("paidBy", "name")
      .populate("contribution.userId", "name");

    if (transactions.length === 0) {
      return sendError(res,400,"No transactions found for this trip.");
    }

    // 2️⃣ Initialize data structure for all users involved
    const userData = {};

    const ensureUser = (userObj) => {
      const uid = userObj._id.toString();
      if (!userData[uid]) {
        userData[uid] = {
          userName: userObj.name,
          totalSpent: 0,
          totalSpentOnSelf: 0
        };
      }
      return uid;
    };

    // 3️⃣ Loop through transactions
    transactions.forEach(tx => {
      const payerId = ensureUser(tx.paidBy);

      // Track how much payer has paid in total
      userData[payerId].totalSpent += tx.amount;

      // If no contributors, entire amount is payer's self-spending
      if (!tx.contribution || tx.contribution.length === 0) {
        userData[payerId].totalSpentOnSelf += tx.amount;
        return;
      }

      // Calculate total contribution sum
      let contributedSum = 0;

      tx.contribution.forEach(c => {
        const contributorId = ensureUser(c.userId);
        contributedSum += c.amount;

        // Add to total spent
        userData[contributorId].totalSpent += c.amount;
        userData[contributorId].totalSpentOnSelf += c.amount;
      });

      // Remaining = what payer spent on themselves
      const remainder = tx.amount - contributedSum;
      if (remainder > 0) {
        userData[payerId].totalSpentOnSelf += remainder;
      }
    });

    // 4️⃣ Convert object → array for response
    const result = Object.values(userData);


    res.status(200).json({ success: true, data: result});

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {settlementsTransactions,getTripSpendingSummary};