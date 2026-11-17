const Organization = require("../models/Organization");

exports.getCurrentOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organizationId).lean();
        if (!organization) return res.status(404).json({ message: "Organization not found" });
        res.status(200).json(organization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCurrentOrganization = async (req, res) => {
    try {
        const updates = {};
        for (const field of ["name", "contactEmail", "phone", "address"]) {
            if (req.body[field] !== undefined) updates[field] = String(req.body[field]).trim();
        }
        if (updates.name !== undefined && !updates.name) {
            return res.status(400).json({ message: "Business name is required" });
        }
        if (
            updates.contactEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contactEmail)
        ) {
            return res.status(400).json({ message: "Business email is invalid" });
        }
        if (updates.contactEmail) updates.contactEmail = updates.contactEmail.toLowerCase();

        const organization = await Organization.findByIdAndUpdate(
            req.user.organizationId,
            { $set: updates },
            { new: true, runValidators: true },
        );
        if (!organization) return res.status(404).json({ message: "Organization not found" });
        res.status(200).json(organization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
