const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const header = req.header("Authorization");
    if (!header) {
      return res.status(401).json({ message: "No token provided" });
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const token = parts[1].trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
