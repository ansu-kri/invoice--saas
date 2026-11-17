const Notification = require("../models/Notification");

exports.createOrganizationNotification = async (data) => {
    try {
        return await Notification.create(data);
    } catch (error) {
        console.error("Could not persist organization notification:", error);
        return null;
    }
};
