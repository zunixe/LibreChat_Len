const express = require('express');
const mongoose = require('mongoose');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();
router.use(requireJwtAuth);
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

router.get('/', requireAdminAccess, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const definitions = await db.collection('endpointDefinitions').find({}).sort({ order: 1 }).toArray();
    res.status(200).json(definitions.map((d) => ({
      endpoint: d.endpoint,
      models: d.models,
      order: d.order,
    })));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/', requireAdminAccess, async (req, res) => {
  try {
    const { definitions } = req.body;
    if (!Array.isArray(definitions)) {
      return res.status(400).json({ message: 'definitions array is required' });
    }
    const db = mongoose.connection.db;
    await db.collection('endpointDefinitions').drop().catch(() => {});
    if (definitions.length > 0) {
      await db.collection('endpointDefinitions').insertMany(
        definitions.map((d, i) => ({
          endpoint: d.endpoint,
          models: d.models,
          order: d.order ?? i + 1,
        })),
      );
    }
    const result = await db.collection('endpointDefinitions').find({}).sort({ order: 1 }).toArray();
    res.status(200).json(result.map((d) => ({
      endpoint: d.endpoint,
      models: d.models,
      order: d.order,
    })));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
