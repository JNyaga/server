const fs = require("fs");
const express = require("express");
const app = express();
const PORT = 4000;

// NEww imports
const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

// Get the messsage.json file and parse the file into JS obj
const rawData = fs.readFileSync("messages.json");
const messageData = JSON.parse(rawData);
// console.log(messageData)

const SocketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
  },
});

// socket.io("connection") function establishes a connection with the React app,
// then creates a unique ID for each socket and logs the ID to the
// console whenever a user visits the web page.
let users = [];
SocketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user has connected`);

  // Send the list of active users to the newly connected client
  socket.emit("newUserResponse", users);

  socket.on("newUser", (data) => {
    // Check if the user already exists
    const userExists = users.some(
      (user) =>
        user.userName === data.userName && user.socketID === data.socketID
    );
    if (!userExists) {
      // Adds the new user to the list of users
      users.push(data);
      console.log(users);
      // Send the list of users to all clients
      SocketIO.emit("newUserResponse", users);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔥: user has disconnected");
    // Updates the list of users when a user disconnects
    users = users.filter((user) => user.socketID !== socket.id);
    // Sends the list of users to all clients
    SocketIO.emit("newUserResponse", users);
  });

  //Listens and logs mesage on console
  socket.on("message", (data) => {
    //saving messages to messages.json
    messageData["messages"].push(data);
    const stringData = JSON.stringify(messageData, null, 2);
    fs.writeFile("messages.json", stringData, (err) => {
      if (err) {
        console.error(err);
      }
    });
    //send message to all users on server, including the sender
    SocketIO.emit("messageResponse", data);
  });
  // listen yo user typing event:
  socket.on("typing", (data) => socket.broadcast.emit("typingResponse", data));
});

//render the message data via api route
app.get("/api", (req, res) => {
  res.json(messageData);
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
