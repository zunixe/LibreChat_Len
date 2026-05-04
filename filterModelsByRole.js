/**
 * Middleware to filter models based on user role
 * Restricts available models to those allowed for the user's role
 */
const filterModelsByRole = (db) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return next();
      }
      
      // Store the role in request for later use
      req.userRole = userRole;
      
      // Get the model-role mapping from database
      const modelRoleMapping = await db.collection('modelRoles').findOne({ role: userRole });
      
      if (modelRoleMapping) {
        req.allowedModels = modelRoleMapping.allowedModels;
      }
      
      next();
    } catch (error) {
      console.error('Error in filterModelsByRole middleware:', error);
      next();
    }
  };
};

module.exports = filterModelsByRole;
