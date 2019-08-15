const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// Set user Schema for DB
const accountSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  age: Number,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zip: String,
  image: String,
  membertype: String,
  view: String
}, {strict: false});
// Add plugin to scheme from passport-local-mongoose
accountSchema.plugin(passportLocalMongoose);
exports.accountSchema = accountSchema;
