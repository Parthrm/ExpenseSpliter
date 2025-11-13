const express = require("express");
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controller/tripController");
const router = express.Router();

router.post("/", createTrip);
router.get("/", getAllTrips);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
