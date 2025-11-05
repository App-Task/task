const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../utils/jwt");
const User = require("../models/User");

// ✅ Middleware to verify JWT token from Authorization header
const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    // Check passwordChangedAt (logout-all behavior)
    const userId = decoded.userId || decoded.id;
    if (userId) {
      const user = await User.findById(userId).select("passwordChangedAt");
      if (user?.passwordChangedAt) {
        const tokenIssuedAtSec = decoded.iat || 0;
        const pwdChangedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (tokenIssuedAtSec < pwdChangedAtSec) {
          return res.status(401).json({ error: "Token invalidated" });
        }
      }
    }
    req.user = decoded; // attach decoded info to req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { verifyTokenMiddleware };
