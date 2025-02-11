const { MongoClient } = require("mongodb");
let database = null;

const URI = process.env.MONGO_URL || "mongodb+srv://voice:voice@cluster0.ylh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
exports.connect = async function () {
  if (database) {
    return database;
  }
  let client = new MongoClient(URI);

  await client.connect();

  database = client.db(process.env.MONGO_DB || "speech");
  return database;
};