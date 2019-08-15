const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// Set user Schema for DB
const userSchema = new mongoose.Schema({
  username: String,
  usernameLowerCase: String,
  password: String,
  email: String,
  emailLowerCase: String,
  verificationCode: String,
  pwResetCode: String,
  pwResetKeyVerified: false,
  active: Boolean
}, {strict: false});
// Add plugin to scheme from passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
exports.userSchema = userSchema;
