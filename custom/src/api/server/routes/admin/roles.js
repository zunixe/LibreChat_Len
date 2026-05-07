const express = require('express');
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

const router = express.Router();
router.use(requireJwtAuth);
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

router.get('/', requireAdminAccess, async (req, res) => {
  try {
    const roles = await listRoles();
    res.status(200).json(roles.map((r) => ({ name: r.name, permissions: r.permissions ?? {} })));
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
    const role = await createRole({
      name: normalizedName,
      permissions: JSON.parse(JSON.stringify(basePerms)),
    });
    res.status(201).json({ name: role.name, permissions: role.permissions ?? {} });
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
