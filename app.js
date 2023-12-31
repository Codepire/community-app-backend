require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");

const app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// create server
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const { connectDb } = require("./db");
connectDb();

// socket middlewares and libs
const {
  createMessageSocket,
  getMessagesSocket,
} = require("./controllers/messageController");
const { verifyTokenIO } = require("./middlewares/authJwt");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.use(verifyTokenIO);

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send_message", async (messageData) => {
    await createMessageSocket(messageData, socket);
    socket.emit("message_created");
    socket.broadcast.emit("message_created");
  });

  socket.on("fetch_messages", async (data) => {
    const messages = await getMessagesSocket(data.channelId);
    socket.emit("messages_fetched", { messages: messages });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const indexRouter = require("./routes/indexRoute");
const authRouter = require("./routes/authRoute");
const userRouter = require("./routes/userRoute");
const serverRouter = require("./routes/serverRoute");
const channelRouter = require("./routes/channelRoute");

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/servers", serverRouter);
app.use("/channels", channelRouter);

server.listen(5000, () => {
  console.log("app is running on port 5000");
});
