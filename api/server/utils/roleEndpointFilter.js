// server/utils/roleEndpointFilter.js
const ROLE_ENDPOINT_MAP = {
  ADMIN: ['len-financial', 'len-risk', 'len-general'],  // Akses semua
  FINANCIAL: ['len-financial', 'len-general'],           // Financial + General
  RISK: ['len-risk', 'len-general'],                     // Risk + General
  USER: ['len-financial', 'len-risk', 'len-general']                                  // Default: hanya General
};

/**
 * Filter endpoint config berdasarkan role user
 * @param {Array} endpoints - Array endpoint dari config LibreChat
 * @param {string} userRole - Role dari JWT payload (req.user.role)
 * @returns {Array} Endpoint yang diizinkan untuk user tersebut
 */
module.exports = function filterEndpointsByRole(endpoints = [], userRole) {
  // Jika role tidak dikenali atau tidak ada, fallback ke 'user'
  const effectiveRole = ROLE_ENDPOINT_MAP[userRole] ? userRole : 'user';
  const allowedKeys = ROLE_ENDPOINT_MAP[effectiveRole];

  return endpoints.filter(ep => {
    // Filter hanya endpoint custom yang punya 'key'
    if (ep.key && allowedKeys) {
      return allowedKeys.includes(ep.key);
    }
    // Endpoint default (openAI, azure, dll) tetap muncul jika tidak difilter
    return !ep.key || allowedKeys.includes('all');
  });
};