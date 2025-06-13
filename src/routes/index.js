const express = require("express");
const app = express();

// 🔹 Import Routes
const authRoutes = require("./auth");
const uploadRoutes = require("./upload");
const chatRoutes = require("./chat");
const profileRoutes = require("./profile");
const bookingRoutes = require("./booking");
const productRoutes = require("./product");
const accountRoutes = require("./account");
const driverRoutes = require("./driver");

// 🔹 Import Middlewares
const authentication = require("../middlewares/authentication");

// 🔹 Apply Global Middlewares
const middlewares = [authentication];

// 🔹 Register Routes
app.use("/api/v1/auth", authRoutes);

// Using middlewares 1
app.use("/api/v1/chats", middlewares, chatRoutes);
app.use("/api/v1/uploads", middlewares, uploadRoutes);
app.use("/api/v1/profiles", middlewares, profileRoutes);
app.use("/api/v1/bookings", middlewares, bookingRoutes);
app.use("/api/v1/products", middlewares, productRoutes);
app.use("/api/v1/accounts", middlewares, accountRoutes);
app.use("/api/v1/drivers", middlewares, driverRoutes);

module.exports = app;
