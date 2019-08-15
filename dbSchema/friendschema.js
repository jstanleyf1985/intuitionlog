const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// Set user Schema for DB
const friendSchema = new mongoose.Schema({
  usernameLowerCase: String,
  friends: Array
}, {strict: false});
// Add plugin to scheme from passport-local-mongoose
friendSchema.plugin(passportLocalMongoose);
exports.friendSchema = friendSchema;
