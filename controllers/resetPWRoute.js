const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');

// Set UserModel for users in the database
const UserReset = new mongoose.model('User', userSchema.userSchema);
passport.use(UserReset.createStrategy());
passport.serializeUser(UserReset.serializeUser());
passport.deserializeUser(UserReset.deserializeUser());

exports.getPWResetRoute = (req, res) => {
  // Reset session error parameters for clearing errors regardless of which page the user is coming from
  req.session.passwordResetErr = null;
  req.session.loginErrors = null;
  req.session.loginErrMsg = null;
  req.session.emailVerifyErrors = null;
  req.session.errors = null;
  req.session.errMsg = null;
  req.session.username = null;
  // Set email verification error
  req.session.passwordResetErr = null;

  // Sanitize URL
  req.sanitize(req.params.username);
  req.sanitize(req.params.key);

  if(req.params.username == null || req.params.username == "") {
    req.session.loginErrMsg = 'Your username or key cannot be empty for password reset, please try again using the email link provided';
    res.redirect('/');
  }
  // Parse URL to verify email linkconst checkVerification = (username, keycode) => {
  // Convert to lowercase for faster DB queries
  username = req.params.username.toLowerCase();

    // Must be username, check username
    UserReset.findOne({usernameLowerCase: username}, (err, data) => {
      // Check if err and data exists
      if(err) {
        req.session.passwordResetErr = 'There was an error processing your request.';
        res.redirect('/');
      } else if(data) {
  
        if(data.pwResetCode) {
          // Username exists, check keycode
          if(data.pwResetCode == req.params.key) {
            // Make sure account has pwResetKeyVerified
            if(data.pwResetKeyVerified == false && data.active == true) {
              // Set flag on account after checking if account is verified
              if(data.active == true) {
                
                data.pwResetKeyVerified = true;
                req.session.passwordResetErr = 'success';
                data.save();
                
                // Set session variable to be used in /passwordreset
                req.session.username = data.usernameLowerCase;
                res.redirect('/passwordreset');
              } else {
                req.session.passwordResetErr = 'Please verify your account before resetting passwords';
                res.redirect('/');
              }
            } else if(data.pwResetKeyVerified == true) {
              // Previous attempt as password reset failed, reset keyverified to false to start again
              data.pwResetKeyVerified = false;
              data.save();

              req.session.passwordResetErr = 'Your password reset failed, please try again';
              // Resend the to the same path automatically
              res.redirect(`/passwordreset`);
            } else {
              req.session.passwordResetErr = 'There is a problem with your account, contact web admin';
              res.redirect('/');
            }
          } else {
            req.session.passwordResetErr = 'Keycode doesnt match';
            res.redirect('/');
          }
        } else {
          req.session.passwordResetErr = 'verification code doesnt exist';
          res.redirect('/');
        }
  
      } else {
        req.session.passwordResetErr = 'There was an error processing your request.';
        res.redirect('/');
      }
    });
  }