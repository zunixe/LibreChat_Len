const { getEndpointsConfig } = require('~/server/services/Config');
const mongoose = require('mongoose');

/**
 * Get modelRoles for a given role from MongoDB
 * @param {string} role - The user's role
 * @returns {Promise<{allowedEndpoints?: string[], allowedModels?: string[]} | null>}
 */
async function getModelRole(role) {
  if (!role || role === 'ADMIN') {
    return null;
  }
  try {
    const db = mongoose.connection.db;
    const doc = await db.collection('modelRoles').findOne({ role });
    return doc || null;
  } catch (err) {
    return null;
  }
}

/**
 * Filter endpoints config based on modelRoles
 * @param {TEndpointsConfig} endpointsConfig - The full endpoints config
 * @param {{allowedEndpoints?: string[]} | null} modelRole - The role's restrictions
 * @returns {TEndpointsConfig} Filtered endpoints config
 */
function filterEndpointsByRole(endpointsConfig, modelRole) {
  if (!modelRole || !modelRole.allowedEndpoints) {
    return endpointsConfig;
  }

  const filtered = {};
  for (const [key, value] of Object.entries(endpointsConfig)) {
    if (modelRole.allowedEndpoints.includes(key)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

async function endpointController(req, res) {
  const endpointsConfig = await getEndpointsConfig(req);
  const modelRole = await getModelRole(req.user?.role);
  const filteredConfig = filterEndpointsByRole(endpointsConfig, modelRole);
  res.send(JSON.stringify(filteredConfig));
}

module.exports = endpointController;
