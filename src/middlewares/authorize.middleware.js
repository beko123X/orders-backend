import { ROLES } from "../config/roles.js";

const authorize = (permission) => {
  return (req, res, next) => {
    const role = req.user.role;

    const permissions = ROLES[role];
    if (!permissions) {
      return res.status(403).json({ message: "Role not allowed" });
    }

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    next();
  };
};

export default authorize;
