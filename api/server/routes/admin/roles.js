const express = require('express');
const mongoose = require('mongoose');
const { SystemRoles } = require('librechat-data-provider');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const {
  listRoles,
  getRoleByName,
  updateRoleByName,
  createRole,
  deleteRoleByName,
  countUsers,
} = require('~/models');

async function getModelRolesMap() {
  try {
    const db = mongoose.connection.db;
    const roles = await db.collection('modelRoles').find({}).toArray();
    const roleMap = {};
    for (const r of roles) {
      if (r.endpoints && Array.isArray(r.endpoints)) {
        roleMap[r.role] = r.endpoints;
      } else {
        const endpointAccess = [];
        const eps = r.allowedEndpoints || [];
        const models = r.allowedModels || [];
        for (const ep of eps) {
          endpointAccess.push({
            endpoint: ep,
            models: models,
            showMCP: ep === 'LEN-AI General',
          });
        }
        roleMap[r.role] = endpointAccess;
      }
    }
    return roleMap;
  } catch (err) {
    return {};
  }
}

const router = express.Router();
router.use(requireJwtAuth);
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

router.get('/', requireAdminAccess, async (req, res) => {
  try {
    const roles = await listRoles();
    const modelRolesMap = await getModelRolesMap();
    res.status(200).json(
      roles.map((r) => ({
        name: r.name,
        permissions: r.permissions ?? {},
        endpointAccess: modelRolesMap[r.name] ?? [],
      })),
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/', requireAdminAccess, async (req, res) => {
  try {
    const { name, basePermissionsFrom } = req.body;
    const normalizedName = (name ?? '').toUpperCase().trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    if (Object.values(SystemRoles).includes(normalizedName)) {
      return res.status(400).json({ message: 'Cannot create a role with a system role name' });
    }
    const existing = await getRoleByName(normalizedName);
    if (existing) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    const baseRole = basePermissionsFrom ? await getRoleByName(basePermissionsFrom) : null;
    const basePerms = baseRole?.permissions ?? {};
    const permissions = JSON.parse(JSON.stringify(basePerms));
    const db = mongoose.connection.db;
    await db.collection('roles').insertOne({ name: normalizedName, permissions });
    res.status(201).json({ name: normalizedName, permissions });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:name/rename', requireAdminAccess, async (req, res) => {
  try {
    const normalizedName = req.params.name.toUpperCase().trim();
    const { newName } = req.body;
    const normalizedNewName = (newName ?? '').toUpperCase().trim();
    if (!normalizedNewName) {
      return res.status(400).json({ message: 'New role name is required' });
    }
    if (Object.values(SystemRoles).includes(normalizedName)) {
      return res.status(400).json({ message: 'Cannot rename a system role' });
    }
    const existing = await getRoleByName(normalizedName);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found' });
    }
    const duplicate = await getRoleByName(normalizedNewName);
    if (duplicate) {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    const db = mongoose.connection.db;
    await db.collection('roles').updateOne({ name: normalizedName }, { $set: { name: normalizedNewName } });
    await db.collection('modelRoles').updateOne({ role: normalizedName }, { $set: { role: normalizedNewName } });
    res.status(200).json({ name: normalizedNewName });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:name/permissions', requireAdminAccess, async (req, res) => {
  try {
    const normalizedName = req.params.name.toUpperCase().trim();
    const existing = await getRoleByName(normalizedName);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found' });
    }
    const updated = await updateRoleByName(normalizedName, { permissions: req.body });
    if (!updated) {
      return res.status(400).json({ message: 'Failed to update role' });
    }
    res.status(200).json({ name: updated.name, permissions: updated.permissions ?? {} });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:name/model-access', requireAdminAccess, async (req, res) => {
  try {
    const normalizedName = req.params.name.toUpperCase().trim();
    const existing = await getRoleByName(normalizedName);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found' });
    }
    const { endpointAccess } = req.body;
    if (!Array.isArray(endpointAccess)) {
      return res.status(400).json({ message: 'endpointAccess must be an array' });
    }
    const db = mongoose.connection.db;
    await db.collection('modelRoles').updateOne(
      { role: normalizedName },
      { $set: { endpoints: endpointAccess } },
      { upsert: true },
    );
    const modelRolesMap = await getModelRolesMap();
    res.status(200).json({
      name: normalizedName,
      endpointAccess: modelRolesMap[normalizedName] ?? [],
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:name', requireAdminAccess, async (req, res) => {
  try {
    const normalizedName = req.params.name.toUpperCase().trim();
    if (Object.values(SystemRoles).includes(normalizedName)) {
      return res.status(400).json({ message: 'Cannot delete a system role' });
    }
    const existing = await getRoleByName(normalizedName);
    if (!existing) {
      return res.status(404).json({ message: 'Role not found' });
    }
    const usersWithRole = await countUsers({ role: normalizedName });
    if (usersWithRole > 0) {
      return res.status(400).json({ message: 'Cannot delete a role assigned to users' });
    }
    await deleteRoleByName(normalizedName);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
