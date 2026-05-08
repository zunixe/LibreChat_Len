const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { SystemRoles } = require('librechat-data-provider');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const {
  findUsers,
  createUser,
  updateUser,
  getUserById,
  deleteUserById,
  countUsers,
} = require('~/models');

const router = express.Router();
router.use(requireJwtAuth);
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

async function getAllModelRoles() {
  try {
    const db = mongoose.connection.db;
    const roles = await db.collection('modelRoles').find({}).toArray();
    const roleMap = {};
    for (const r of roles) {
      if (r.endpoints && Array.isArray(r.endpoints)) {
        roleMap[r.role] = {
          allowedEndpoints: r.endpoints.map((e) => e.endpoint),
          allowedModels: [...new Set(r.endpoints.flatMap((e) => e.models))],
          endpointAccess: r.endpoints,
        };
      } else {
        roleMap[r.role] = {
          allowedEndpoints: r.allowedEndpoints || null,
          allowedModels: r.allowedModels || null,
          endpointAccess: (r.allowedEndpoints || []).map((ep) => ({
            endpoint: ep,
            models: r.allowedModels || [],
            showMCP: ep === 'LEN-AI General',
          })),
        };
      }
    }
    return roleMap;
  } catch (err) {
    return {};
  }
}

function mapUser(user, modelRole) {
  return {
    id: (user._id?.toString() ?? user.id ?? ''),
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? SystemRoles.USER,
    provider: user.provider ?? 'local',
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : '',
    modelAccess: modelRole || null,
  };
}

router.get('/', requireAdminAccess, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const search = req.query.search || '';
    const filter = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { username: regex },
        { role: regex },
      ];
    }
    const users = await findUsers(filter, null, { limit });
    const modelRoles = await getAllModelRoles();
    const mapped = users.map((u) => mapUser(u, modelRoles[u.role] || null));
    const db = mongoose.connection.db;
    const distinctRoles = await db.collection('users').distinct('role');
    res.status(200).json({ users: mapped, modelRoles, distinctRoles });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/', requireAdminAccess, async (req, res) => {
  try {
    const { email, name, password, role, allowedEndpoints, allowedModels } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const userData = {
      email,
      name,
      role: role ?? SystemRoles.USER,
      provider: 'local',
      password: password ? bcrypt.hashSync(password, 10) : undefined,
    };
    const user = await createUser(userData, undefined, true, true);

    if (allowedEndpoints !== undefined || allowedModels !== undefined || req.body.endpointAccess !== undefined) {
      const db = mongoose.connection.db;
      const userRole = role ?? SystemRoles.USER;
      if (req.body.endpointAccess) {
        await db.collection('modelRoles').updateOne(
          { role: userRole },
          { $set: { endpoints: req.body.endpointAccess, updatedAt: new Date() } },
          { upsert: true },
        );
      } else {
        const modelRoleUpdate = {};
        if (allowedEndpoints !== undefined) {
          modelRoleUpdate.allowedEndpoints = allowedEndpoints;
        }
        if (allowedModels !== undefined) {
          modelRoleUpdate.allowedModels = allowedModels;
        }
        await db.collection('modelRoles').updateOne(
          { role: userRole },
          { $set: { ...modelRoleUpdate, updatedAt: new Date() } },
          { upsert: true },
        );
      }
    }

    const modelRoles = await getAllModelRoles();
    res.status(201).json(mapUser(user, modelRoles[user.role] || null));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', requireAdminAccess, async (req, res) => {
  try {
    const existing = await getUserById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.emailVerified !== undefined) updateData.emailVerified = req.body.emailVerified;

    if (req.body.allowedEndpoints !== undefined || req.body.allowedModels !== undefined || req.body.endpointAccess !== undefined) {
      const db = mongoose.connection.db;
      const role = req.body.role !== undefined ? req.body.role : existing.role;
      if (req.body.endpointAccess) {
        await db.collection('modelRoles').updateOne(
          { role },
          { $set: { endpoints: req.body.endpointAccess, updatedAt: new Date() } },
          { upsert: true },
        );
      } else {
        const modelRoleUpdate = {};
        if (req.body.allowedEndpoints !== undefined) {
          modelRoleUpdate.allowedEndpoints = req.body.allowedEndpoints;
        }
        if (req.body.allowedModels !== undefined) {
          modelRoleUpdate.allowedModels = req.body.allowedModels;
        }
        await db.collection('modelRoles').updateOne(
          { role },
          { $set: { ...modelRoleUpdate, updatedAt: new Date() } },
          { upsert: true },
        );
      }
    }

    const updated = await updateUser(req.params.id, updateData);
    if (!updated) {
      return res.status(400).json({ message: 'Failed to update user' });
    }
    const modelRoles = await getAllModelRoles();
    res.status(200).json(mapUser(updated, modelRoles[updated.role] || null));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireAdminAccess, async (req, res) => {
  try {
    const existing = await getUserById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (existing.role === SystemRoles.ADMIN) {
      const adminCount = await countUsers({ role: SystemRoles.ADMIN });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    await deleteUserById(req.params.id);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/reset-password', requireAdminAccess, async (req, res) => {
  try {
    const existing = await getUserById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    await updateUser(req.params.id, { password: bcrypt.hashSync(password, 10) });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
