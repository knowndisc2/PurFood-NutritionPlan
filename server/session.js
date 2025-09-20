const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const SECRET = "dev_secret";

app.use(express.json());
app.use(cookieParser());

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/login", (req, res) => {
  const { email } = req.body;
  const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });
  res.cookie("token", token, { httpOnly: true });
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

module.exports = { app, authMiddleware };
