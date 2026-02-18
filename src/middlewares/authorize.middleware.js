// backend/middlewares/authorize.middleware.js
import { ROLE_PERMISSIONS } from "../config/permissions.js";

const authorize = (requiredPermission) => {
  return (req, res, next) => {
    try {
      // التأكد من وجود المستخدم
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated" 
        });
      }

      const userRole = req.user.role;
      
      // Admin لديه كل الصلاحيات
      if (userRole === 'admin') {
        return next();
      }

      // جلب صلاحيات الدور
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      // التحقق من الصلاحية المطلوبة
      if (userPermissions.includes(requiredPermission)) {
        return next();
      }

      // إذا لم يكن لديه صلاحية
      console.log(`❌ Access denied for user ${req.user._id} (${userRole}) to permission: ${requiredPermission}`);
      
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Insufficient permissions." 
      });

    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Authorization failed" 
      });
    }
  };
};

export default authorize;