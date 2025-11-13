const userModel = require("../models/userModel.js");
const validMongooseId = require("../utils/validMongooseId.js");

// create a new user
const createUser = async (req, res) => {
  try {
    const { userName, userPhoneNo } = req.body;
    
    if (!userName || !userPhoneNo) {
      res.status(400);
      throw new Error("Incomplete data sent.");
    }

    const userNameUsed = await userModel.findOne({ name: userName });
    const userPhoneNoUsed = await userModel.findOne({ phoneNo: userPhoneNo });
    if (userNameUsed || userPhoneNoUsed) {
      res.status(409);
      throw new Error("Credentials already used.");
    }

    const formattedUserName = userName.trim();
    const formattedUserPhoneNo = userPhoneNo.trim();

    if (!formattedUserName || !formattedUserPhoneNo) {
      res.status(404);
      throw new Error("Found empty credentials.");
    }

    const newUser = await userModel.create({
      name: formattedUserName,
      phoneNo: formattedUserPhoneNo
    });

    if (newUser) {      
      res.status(201).send({ success: true, message: "New user successfully created!" });
    } else {
      res.status(500);
      throw new Error("DB error occurred while creating user.");
    }
    
  } catch (error) {
    res.send({ success: false, message: error.message });
  }
};

// get all users
const getAllUsers = async (req, res) => {
  try {
    const userData = await userModel.find({}).select(["_id", "name", "phoneNo"]);
    res.status(200).send({success:true,message:null,data:userData});
  } catch (error) {
    res.status(500).send({ success: false, message: error.message, data:null });
  }
};

// get just one user
const getOneUser = async (req,res) => {
  try {
    const { id } = req.params;
    if(validMongooseId(id)){
      throw new Error("Invalid Id send.");
    }
    const userData = await userModel.findById(id).select(["_id", "name", "phoneNo"]);
    res.status(200).send({ success: true, message: null, data:userData });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message, data:null });
  }
}

// update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userPhoneNo } = req.body;
    
    if(!validMongooseId(id)){
      throw new Error("Invalid Id send.");
    }

    if (!userName && !userPhoneNo) {
      res.status(400);
      throw new Error("No fields provided to update.");
    }

    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      res.status(404);
      throw new Error("User not found.");
    }

    // check for duplicate username or phone number
    if (userName) {
      const nameUsed = await userModel.findOne({ name: userName, _id: { $ne: id } });
      if (nameUsed) {
        res.status(409);
        throw new Error("Username already in use.");
      }
    }

    if (userPhoneNo) {
      const phoneUsed = await userModel.findOne({ phoneNo: userPhoneNo, _id: { $ne: id } });
      if (phoneUsed) {
        res.status(409);
        throw new Error("Phone number already in use.");
      }
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      {
        ...(userName && { name: userName.trim() }),
        ...(userPhoneNo && { phoneNo: userPhoneNo.trim() })
      },
      { new: true }
    );

    res.status(200).send({ success: true, message: "User updated successfully!", data: updatedUser });
  } catch (error) {
    res.send({ success: false, message: error.message });
  }
}; 

// delete user
const deleteUser =  async (req, res) => {
  try {
    const { id } = req.params;
    if(!validMongooseId(id)){
      throw new Error("Invalid Id send.");
    }
    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      res.status(404);
      throw new Error("User not found.");
    }

    res.status(200).send({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    res.send({ success: false, message: error.message });
  }
};

module.exports = {createUser,getAllUsers,getOneUser,updateUser,deleteUser};