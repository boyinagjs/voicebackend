const express = require("express");
const router = express.Router();
const User = require("./User");

// Super Admin - Get active admins and clients
router.get("/super-admin/active-users", async (req, res) => {
    try {
        const currentTime = new Date();
        const admins = await User.find({ role: "admin", expiresAt: { $gt: currentTime } });
        const clients = await User.find({ role: "client", expiresAt: { $gt: currentTime } });
        return res.json({ admins, clients });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching users" });
    }
});

// Super Admin - Get all admins and clients
router.get("/super-admin/all-users", async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" });
        const clients = await User.find({ role: "client" });
        return res.json({ admins, clients });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching users" });
    }
});

// Admin - Get all clients
router.get("/admin/all-clients/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const admin = await User.findById(userId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const clients = await User.find({ createdBy: admin._id });

        return res.json({ clients });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching clients" });
    }
});

// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

// Admin - Get active clients
router.get("/admin/active-clients/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const admin = await User.findById(userId);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ message: "Access Denied" });
        }

        const currentTime = new Date();
        const clients = await User.find({ createdBy: admin._id, expiresAt: { $gt: currentTime } });

        res.json({ clients });
    } catch (error) {
        res.status(500).json({ message: "Error fetching clients" });
    }
});



module.exports = router;
