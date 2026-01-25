const logger = require("../../logger");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Keep backward compatibility while matching the main auth middleware shape
    req.user = { userId: decoded.userId, companyId: decoded.companyId };
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;

    next();
  } catch (err) {
    logger.error("JWT ERROR:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
