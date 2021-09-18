require("dotenv").config({ path: "./config.env" });
const httpServer = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();

const server = httpServer.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3000"
    }
})

//listening events
io.on("connection",(socket) => {
        console.log("we have a new connection")
})

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("server running on port", PORT);
});
