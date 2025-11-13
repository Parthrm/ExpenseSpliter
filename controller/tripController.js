const tripModel = require("../models/tripModel.js");

// ---------- Helper Functions ----------
const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message });
};

const validateTripName = (name) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Trip name is required and must be a valid string.");
  }
  return name.trim();
};

// ---------- Handlers ----------

// Create a new trip
const createTrip = async (req, res) => {
  try {
    const { name } = req.body;
   
    const tripName = validateTripName(name);

    const existingTrip = await tripModel.findOne({ name: tripName });
    if (existingTrip) {
      return sendError(res, 409, "Trip name already exists.");
    }

    const newTrip = await tripModel.create({ name: tripName });
    res.status(201).json({ success: true, message: "Trip created successfully!", data: newTrip });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// View all trips
const getAllTrips = async (req, res) => {
  try {
    const trips = await tripModel.find({}).select(["_id", "name"]);
    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    sendError(res, 500, "Error fetching trips.");
  }
};

// View a single trip
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripModel.findById(id).select(["_id", "name"]);

    if (!trip) {
      return sendError(res, 404, "Trip not found.");
    }

    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    sendError(res, 400, "Invalid trip ID.");
  }
};

// Update a trip
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tripName = validateTripName(name);

    const trip = await tripModel.findById(id);
    if (!trip) {
      return sendError(res, 404, "Trip not found.");
    }

    // Check for duplicate name
    const duplicate = await tripModel.findOne({ name: tripName, _id: { $ne: id } });
    if (duplicate) {
      return sendError(res, 409, "Trip name already in use.");
    }

    trip.name = tripName;
    await trip.save();

    res.status(200).json({ success: true, message: "Trip updated successfully!", data: trip });
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Delete a trip
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripModel.findByIdAndDelete(id);

    if (!trip) {
      return sendError(res, 404, "Trip not found.");
    }

    res.status(200).json({ success: true, message: "Trip deleted successfully!" });
  } catch (error) {
    sendError(res, 400, "Invalid trip ID.");
  }
};

module.exports = {createTrip,getAllTrips,getTripById,updateTrip,deleteTrip}
