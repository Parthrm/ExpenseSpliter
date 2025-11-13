const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount:{
    type:Number,
    required:true,
    min:0
  },
  description:{
    type:String,
    required:false,
    default:""
  },
  paidBy: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  tripId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  contribution:[{
    _id:false,
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
    amount:{
      type:Number,
      required:true,
      min:0
    },
    paymentDone:{
      type:Boolean,
      required:true,
      default:false
    }
  }]
},{timestamps:true});

module.exports = mongoose.model("Transaction",transactionSchema);