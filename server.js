require("dotenv").config();
const mongoose = require("mongoose");
const Document = require("./Document");
const password = encodeURIComponent(process.env.PASS);
const username = encodeURIComponent(process.env.USERNAME);
var connectionString = `mongodb+srv://${username}:${password}@editor-data.knfygrr.mongodb.net`;

// mongoose.connect(connectionString);
const run = async () => {
  await mongoose.connect(connectionString);
  console.log("Connected to myDB");
};

run()
  .then(() => console.log("connect DB"))
  .catch((err) => console.error(err));

const defValue = "";

const io = require("socket.io")(3001, {
  cors: {
    origin: "https://collabeditor-client.onrender.com",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    // joned to a private room
    socket.join(documentId);
    // loaded data for that room
    console.log(documentId);
    socket.emit("load-document", document?.data);
    // sending realtime changes to room
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
  console.log("connected");
});
// const http = require("http").createServer();
// io.attach(http);
// http.listen(3001, () => console.log("Server listening on port 3001"));

async function findOrCreateDocument(id) {
  if (!id) return;
  const doc = await Document.findById(id);
  if (doc) return doc;
  return await Document.create({ _id: id, data: defValue });
}
