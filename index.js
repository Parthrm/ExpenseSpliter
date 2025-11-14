const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require("./routers/userRouter.js");
const transactionRoutes = require("./routers/transactionRouter.js");
const tripRoutes = require("./routers/tripRouter.js");
const reportRoutes = require("./routers/reportRouter.js");
const urlbp = require("body-parser");

const app = express()
dotenv.config();

const PORT = process.env.PORT;
const MONGOURL = process.env.MONGO_URL;

app.use(urlbp.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/users',userRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/trips',tripRoutes);
app.use('/api/reports',reportRoutes);
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: "Welcome to the Expense Splitter API!",
        version: "1.0"
    });
});

  
mongoose.connect(MONGOURL).then(()=>{
  console.log("DB Connection successful");
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })
}).catch((error)=>console.error(error));

// TODO : sort transactions in latest first order 
// TODO : toggle for payment of contributor
// TODO : update settlements to incorporate paid contri
// TODO : to delete trip, also delete trans

// TODO : minimum amt 1 for new tarnsaction