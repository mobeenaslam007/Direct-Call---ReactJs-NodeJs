const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowHeaders: ["*"],
    credentials:true
  },
});

app.use(cors());

const PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.send("Running");
});

let userId = null;
io.use(function (socket, next) {
  console.log("Query: ", socket.handshake.query.CustomId);
  // return the result of next() to accept the connection.
  //   userId = socket.handshake.query.CustomId
  socket.id = socket.handshake.query.CustomId;
//   io.engine.generateId = function (req) {
//     // generate a new custom id heresocket.id = socket.handshake.query.CustomId
//     socket.handshake.query.CustomId;
//   };
  next(null, true);
});

io.on("connection", (socket) => {
  console.log("me", socket.id);
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    console.log("Call user : ",{ userToCall } )
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    console.log("Response sent")
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
