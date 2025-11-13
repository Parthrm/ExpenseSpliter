const mongoose = require("mongoose");

module.exports = async (id, tableName = null) => {
    // 1. Check if the provided ID is a valid Mongoose ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        // If the ID is not a valid Mongoose ID, return false immediately.
        return false;
    }

    // 2. Check if a tableName was provided
    if (tableName) {
        try {
            // Get the Mongoose model using the provided table name
            // Note: Mongoose typically stores models by their singular name (e.g., 'User').
            // Ensure the name passed matches a registered model name.
            const Model = mongoose.model(tableName);

            // Check the existence of the ID inside the provided table/model
            const exists = await Model.exists({ _id: id });

            // If the document exists, exists will be an object ({_id: id}), which is truthy.
            // If it doesn't exist, exists will be null, which is falsy.
            return !!exists;
            
        } catch (error) {
            // This catch block handles cases where the model name might be invalid or 
            // the database operation fails. 
            console.error(`Error checking ID existence in table ${tableName}:`, error);
            // If there's an error finding the model or performing the check, 
            // you might want to return false or re-throw, depending on desired error handling.
            return false;
        }
    }

    // 3. If the ID is valid (passed step 1) but no tableName was provided (passed step 2)
    // The requirement only specifies returning true when the ID exists AND table is provided.
    // If only ID validity is required (and no table check), returning true here validates the format.
    // Based on the strict requirement: "if the id is not valid mongoose id then just return false"
    // and the specific conditions for returning true/false with tableName, 
    // it's safest to assume that if only ID validity is confirmed but no existence check is run, 
    // we should return true to indicate the format is correct, or false if we MUST confirm existence.
    // Following the spirit of the code which only returns true *if* existence is confirmed:
    return false; // ID is valid format, but existence check was skipped/not requested.

    // A common alternative implementation would be to return true here,
    // as it confirms the ID is a valid *format* when an existence check isn't required:
    // return true; 
};