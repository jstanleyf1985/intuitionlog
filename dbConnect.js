const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
// Connect to DB
const connectToDB = () => {
  const mongoDBURL = process.env.mongoDBURL;
  mongoose.connect(mongoDBURL, {
  useNewUrlParser: true,
  reconnectTries: 100,
  reconnectInterval: 500,
  autoReconnect: true,
  dbName: 'userDB'
}).catch(err => console.log('Mongo connection error', err));
mongoose.set('useCreateIndex', true);
}
exports.connectToDB = connectToDB;