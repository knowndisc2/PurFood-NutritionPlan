const express = require("express");
const { app: sessionApp, authMiddleware } = require("./session");
const { users, goals, mealHistory } = require("./db");
const app = express();

app.use(express.json());

app.post("/api/users", (req, res) => {
  const user = { id: Date.now().toString(), ...req.body };
  users.push(user);
  res.json(user);
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

app.put("/api/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

app.delete("/api/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  users.splice(idx, 1);
  res.json({ success: true });
});

app.post("/api/goals", authMiddleware, (req, res) => {
  const goal = { id: Date.now().toString(), userId: req.user.email, ...req.body };
  goals.push(goal);
  res.json(goal);
});

app.get("/api/goals", authMiddleware, (req, res) => {
  res.json(goals.filter(g => g.userId === req.user.email));
});

app.post("/api/meals", authMiddleware, (req, res) => {
  const meal = { id: Date.now().toString(), userId: req.user.email, ...req.body };
  mealHistory.push(meal);
  res.json(meal);
});

app.get("/api/meals", authMiddleware, (req, res) => {
  res.json(mealHistory.filter(m => m.userId === req.user.email));
});

app.use(sessionApp);

app.listen(4000);
