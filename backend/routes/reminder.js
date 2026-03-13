const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth');
const { getReminder } = require('../models/Reminder');

// GET /api/reminder — list user's reminders
router.get('/', protect, async (req, res) => {
    try {
        const Reminder = getReminder();
        const reminders = await Reminder.findAll({
            where: { farmerId: req.user.id },
            order: [['reminderDate', 'ASC']],
        });
        res.json({ reminders });
    } catch (err) {
        console.error('Reminder fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch reminders.' });
    }
});

// POST /api/reminder — create a reminder
router.post('/', protect, async (req, res) => {
    try {
        const Reminder = getReminder();
        const { reminderType, message, reminderDate } = req.body;
        if (!message || !reminderDate) return res.status(400).json({ message: 'Message and reminderDate are required.' });

        const reminder = await Reminder.create({
            farmerId: req.user.id,
            reminderType: reminderType || 'General',
            message,
            reminderDate: new Date(reminderDate)
        });
        res.status(201).json({ reminder });
    } catch (err) {
        console.error('Create reminder error:', err);
        res.status(500).json({ message: 'Failed to create reminder.' });
    }
});

// DELETE /api/reminder/:id — delete a reminder
router.delete('/:id', protect, async (req, res) => {
    try {
        const Reminder = getReminder();
        const deleted = await Reminder.destroy({ where: { id: req.params.id, farmerId: req.user.id } });
        if (!deleted) return res.status(404).json({ message: 'Reminder not found.' });
        res.json({ message: 'Reminder deleted.' });
    } catch (err) {
        console.error('Delete reminder error:', err);
        res.status(500).json({ message: 'Failed to delete reminder.' });
    }
});

// GET /api/reminder/due — get due reminders (polled by frontend)
router.get('/due', protect, async (req, res) => {
    try {
        const Reminder = getReminder();
        const now = new Date();
        const due = await Reminder.findAll({
            where: {
                userId: req.user.id,
                dateTime: { [Op.lte]: now },
                sent: false,
            },
        });

        // Mark as sent
        if (due.length > 0) {
            await Reminder.update({ sent: true }, {
                where: { id: due.map(r => r.id) }
            });
        }

        res.json({ due });
    } catch (err) {
        console.error('Due reminders error:', err);
        res.status(500).json({ message: 'Failed to check due reminders.' });
    }
});

module.exports = router;
