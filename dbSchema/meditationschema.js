const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// Set user Schema for DB
const meditationSchema = new mongoose.Schema({
  username: String,
  meditationName: String,
  meditationType: String,
  meditationDuration: Number,
  meditationDate: Date,
  meditationRating: Number,
  meditationNotes: String,
  date: Date
}, {strict: false});
// Add plugin to scheme from passport-local-mongoose
meditationSchema.plugin(passportLocalMongoose);
exports.meditationSchema = meditationSchema;
