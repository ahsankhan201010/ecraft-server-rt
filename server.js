require("dotenv").config({ path: "./config.env" });
const httpServer = require("http");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");

const app = express();

//maintaining connection list a/c to userId(_id in user colelction)

var users = [];

const addUser = ({ socketId, userId }) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ socketId, userId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => `${user.userId}` === `${userId}`);
};

const server = httpServer.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

//listening events
io.on("connection", (socket) => {
  console.log("we have a new connection");
  // socket.on("connect") 
  socket.on("online", (userId) => {
    addUser({ socketId: socket.id, userId });
    console.log(users);
  }); //on event listen -> client (defined event)

  socket.on("disconnect", () => { //predefined event (when u call socket.disconnect from clinet)
    removeUser(socket.id);
    console.log(users)
  });
});


const connection_string = process.env.MONGO_STRING.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

mongoose.connect(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected!");
  //watching notfications
  const notificationCollection = db.collection("notifications");
  const notificationChangeStream = notificationCollection.watch();
  notificationChangeStream.on("change", (change) => {
    console.log(change)
    if(change.operationType === "insert") {
      var doc = change.fullDocument;
      var {user} = doc;
      var connectedUser = getUser(user)
      if(connectedUser) {
        io.to(connectedUser.socketId).emit("notification",doc)  //server -> client (event)
      }
    }
  });
});


const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("server running on port", PORT);
});
