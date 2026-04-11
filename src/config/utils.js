
const utils = {
    // Generate a random ID
    generateId: (length = 8) => {
        return crypto.randomBytes(length).toString("hex");
    },

    // Format a date nicely
    formatDate: (date) => {
        return new Date(date).toISOString().replace("T", " ").split(".")[0];
    },

    // Example: safely get a nested property
    getNested: (obj, path, defaultValue = null) => {
        return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), obj);
    },
};

module.exports = utils;