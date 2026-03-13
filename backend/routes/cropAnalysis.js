const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCropIssueReport } = require('../models/CropIssueReport');

// GET /api/analysis — List all analysis reports for user
router.get('/', protect, async (req, res) => {
    try {
        const CropIssueReport = getCropIssueReport();
        const { id: userId } = req.user;

        const reports = await CropIssueReport.findAll({
            where: { farmer_id: userId },
            order: [['report_generated_at', 'DESC']],
            raw: true
        });

        res.json({ reports });
    } catch (error) {
        console.error('Fetch analysis error:', error);
        res.status(500).json({ message: 'Failed to load analysis reports.' });
    }
});

// DELETE /api/analysis/:id — Delete a report
router.delete('/:id', protect, async (req, res) => {
    try {
        const CropIssueReport = getCropIssueReport();
        const { id: userId } = req.user;
        const { id } = req.params;

        const deleted = await CropIssueReport.destroy({ where: { id, farmer_id: userId } });
        res.json({ message: 'Report deleted.', deletedCount: deleted });
    } catch (error) {
        console.error('Delete analysis error:', error);
        res.status(500).json({ message: 'Failed to delete report.' });
    }
});

module.exports = router;
