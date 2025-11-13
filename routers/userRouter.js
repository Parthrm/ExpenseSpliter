const express = require("express");
const {
  createUser,
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
} = require("../controller/userController");
const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getOneUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
