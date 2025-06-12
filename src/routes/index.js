const express = require("express");
const app = express();

// 🔹 Import Routes
const authRoutes = require("./auth");
const chatRoutes = require("./chat");
const profileRoutes = require("./profile");

// 🔹 Import Middlewares
const authentication = require("../middlewares/authentication");

// 🔹 Apply Global Middlewares
const middlewares = [authentication];

// 🔹 Register Routes
app.use("/api/v1/auth", authRoutes);

// Using middlewares 1
app.use("/api/v1/chats", middlewares, chatRoutes);
app.use("/api/v1/profiles", middlewares, profileRoutes);

module.exports = app;
