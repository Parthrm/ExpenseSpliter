const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
    unique:true
  },
},{timestamps:true});

module.exports = mongoose.model("Trip",tripSchema);