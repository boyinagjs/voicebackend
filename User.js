const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    expireshours: { type: String, required: true },
    createdBy: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);