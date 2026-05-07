const { CacheKeys } = require('librechat-data-provider');
const { loadDefaultModels, loadConfigModels } = require('~/server/services/Config');
const { getLogStores } = require('~/cache');
const { logger } = require('~/config');
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
    logger.error('[getModelRole] Error fetching modelRoles:', err);
    return null;
  }
}

/**
 * Filter models config based on modelRoles
 * @param {TModelsConfig} modelConfig - The full models config
 * @param {{allowedEndpoints?: string[], allowedModels?: string[]} | null} modelRole - The role's restrictions
 * @returns {TModelsConfig} Filtered models config
 */
function filterModelsByRole(modelConfig, modelRole) {
  if (!modelRole) {
    return modelConfig;
  }

  const { allowedEndpoints, allowedModels } = modelRole;
  const filtered = {};

  for (const [endpoint, models] of Object.entries(modelConfig)) {
    if (allowedEndpoints && !allowedEndpoints.includes(endpoint)) {
      continue;
    }
    if (allowedModels && Array.isArray(models)) {
      const filteredModels = models.filter((m) => allowedModels.includes(m));
      if (filteredModels.length > 0) {
        filtered[endpoint] = filteredModels;
      }
    } else {
      filtered[endpoint] = models;
    }
  }

  return filtered;
}

/**
 * @param {ServerRequest} req
 * @returns {Promise<TModelsConfig>} The models config.
 */
const getModelsConfig = async (req) => {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  let modelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (!modelsConfig) {
    modelsConfig = await loadModels(req);
  }

  return modelsConfig;
};

/**
 * Loads the models from the config.
 * @param {ServerRequest} req - The Express request object.
 * @returns {Promise<TModelsConfig>} The models config.
 */
async function loadModels(req) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cachedModelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (cachedModelsConfig) {
    return cachedModelsConfig;
  }
  const defaultModelsConfig = await loadDefaultModels(req);
  const customModelsConfig = await loadConfigModels(req);

  const modelConfig = { ...defaultModelsConfig, ...customModelsConfig };

  await cache.set(CacheKeys.MODELS_CONFIG, modelConfig);
  return modelConfig;
}

async function modelController(req, res) {
  try {
    const modelConfig = await loadModels(req);
    const modelRole = await getModelRole(req.user?.role);
    const filteredConfig = filterModelsByRole(modelConfig, modelRole);
    res.send(filteredConfig);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).send({ error: error.message });
  }
}

module.exports = { modelController, loadModels, getModelsConfig };
