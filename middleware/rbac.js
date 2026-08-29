require("dotenv").config();

/**
 * Restrict access to specific user roles.
 *
 * Available roles:
 * - "superadmin"  → Full system access
 * - "admin"       → Administrative access
 * - "supervisor"  → Manage assigned workforce/meters
 * - "installer"   → Access assigned installation tasks
 * - "user"        → Basic user access
 *
 * @param {...("superadmin"|"admin"|"supervisor"|"installer"|"user")} allowedRoles
 * @returns {import("express").RequestHandler}
 */
function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}

module.exports = {
  allowRoles,
};