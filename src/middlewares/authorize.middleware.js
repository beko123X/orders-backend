import { ROLE_PERMISSIONS } from "../config/permissions.js";

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated" 
        });
      }

      const userRole = req.user.role;
      
      // Admin has all permissions
      if (userRole === 'admin') {
        return next();
      }

      const userPermissions = ROLE_PERMISSIONS[userRole] || [];
      
      if (userPermissions.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Insufficient permissions." 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Authorization failed" 
      });
    }
  };
};

export default authorize;