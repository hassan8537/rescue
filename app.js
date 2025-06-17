// dotenv
require("dotenv").config();

// global variable
global.rootDir = __dirname;

// imports
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");
const connectToDatabase = require("./src/config/mongodb");
const adminSeeder = require("./src/middlewares/admin-seeder");
const handlers = require("./src/utilities/handlers");
const path = require("path");

// environments
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || "development";
const secretKey = process.env.SECRET_KEY;
const maxAge = Number(process.env.MAX_AGE) || 2592000000;
const baseUrl = process.env.BASE_URL;

const app = express();

// static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// keys
const server =
  nodeEnv === "production"
    ? (() => {
        try {
          const options = {
            key: fs.readFileSync(
              "/etc/letsencrypt/live/client1.appsstaging.com/privkey.pem"
            ),
            cert: fs.readFileSync(
              "/etc/letsencrypt/live/client1.appsstaging.com/cert.pem"
            ),
            ca: fs.readFileSync(
              "/etc/letsencrypt/live/client1.appsstaging.com/chain.pem"
            )
          };
          return require("https").createServer(options, app);
        } catch (error) {
          console.error(
            "SSL certificate files are missing or incorrect:",
            error
          );
          process.exit(1);
        }
      })()
    : require("http").createServer(app);

// middlewares
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge }
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(morgan("tiny"));
app.use(adminSeeder);

// controllers
const chatController = require("./src/controllers/chat");

// routes
const userRoutes = require("./src/routes/index");
app.use(userRoutes);

// socket
const io = new Server(server, {
  cors: {
    origin:
      nodeEnv === "production" ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: nodeEnv === "production",
    transports: ["websocket", "polling"],
    allowEIO3: true
  }
});

const bookingService = require("./src/services/booking");
bookingService.io = io;

io.on("connection", async (socket) => {
  handlers.logger.success({ message: `New socket connected: ${socket.id}` });

  // chat sockets
  socket.on("new-chat", async ({ senderId, receiverId, text }) => {
    try {
      const newChat = await chatController.newChat({
        senderId: senderId,
        receiverId: receiverId,
        text
      });

      socket.emit("response", newChat);
      return io.to(receiverId.toString()).emit("response", newChat);
    } catch (error) {
      handlers.logger.error({ message: error });
      return socket.emit(
        "error",
        handlers.event.error({
          objectType: "error",
          message: "Failed to send message"
        })
      );
    }
  });

  socket.on("get-chats", async ({ senderId, receiverId }) => {
    try {
      const chats = await chatController.getChats({
        senderId: senderId,
        receiverId: receiverId
      });

      handlers.logger.success({ message: "Messages", data: chats });
      return socket.emit(
        "response",
        handlers.event.success({
          objectType: "chats",
          message: "Messages",
          data: chats
        })
      );
    } catch (error) {
      handlers.logger.error({ message: error });
      return socket.emit(
        "error",
        handlers.event.error({
          objectType: "error",
          message: "Couldn't refresh messages"
        })
      );
    }
  });

  // booking sockets
  socket.on("join-room", async ({ userId }) => {
    await bookingService.joinRoom(socket, { userId });
  });

  socket.on(
    "send-booking-request-to-mechanics",
    async ({ bookingId, driverId }) => {
      await bookingService.sendBookingRequestToMechanics(socket, {
        bookingId,
        driverId
      });
    }
  );

  socket.on(
    "send-quote-to-driver",
    async ({ bookingId, mechanicId, estimatedTimeInHours }) => {
      await bookingService.sendQuoteToDriver(socket, {
        bookingId,
        mechanicId,
        estimatedTimeInHours
      });
    }
  );

  socket.on("accept-mechanic-quote", async ({ quoteId, driverId }) => {
    await bookingService.acceptMechanicQuote(socket, {
      quoteId,
      driverId
    });
  });

  socket.on("reject-mechanic-quote", async ({ quoteId, driverId }) => {
    await bookingService.rejectMechanicQuote(socket, {
      quoteId,
      driverId
    });
  });
});

// server
server.listen(port, () => {
  connectToDatabase();
  handlers.logger.success({ message: `Spont Network is live at ${baseUrl}` });
});
