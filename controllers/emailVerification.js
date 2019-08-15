const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const accountSchema = require('../dbSchema/accountschema');

// Set UserModel for users in the database
const UserEmail = new mongoose.model('User', userSchema.userSchema);
passport.use(UserEmail.createStrategy());
passport.serializeUser(UserEmail.serializeUser());
passport.deserializeUser(UserEmail.deserializeUser());

// Set model for account settings creation
const AccountCreation = new mongoose.model('Account', accountSchema.accountSchema);
passport.use(AccountCreation.createStrategy());

exports.getEmailVerifyPage = (req, res) => {
  // Reset errors if coming from a page where errors were listed
  req.session.loginErrors = null;
  req.session.loginErrMsg = null;
  req.session.errors = null;
  req.session.errMsg = null;
  // Set email verification error
  req.session.emailVerifyErrors = null;

  // Sanitize URL
  req.sanitize(req.params.username);
  req.sanitize(req.params.key);
  
  // Parse URL to verify email link
  // Convert to lowercase for faster DB queries
  username = req.params.username.toLowerCase();

    // Check if username exists
    UserEmail.findOne({usernameLowerCase: username}, (err, data) => {
      // Check if err and data exists
      if(err) {
        req.session.emailVerifyErrors = 'There was an error processing your request.';
        res.redirect('/');
      } else if(data) {

        if(data.verificationCode) {
          // Username exists, check keycode
          if(data.verificationCode == req.params.key) {
            data.active = true;
            data.save();

            // No errors
            req.session.emailVerifyErrors = 'success';

            // Create account settings now that account has been verified
            AccountCreation.findOneAndUpdate(
              {'username': username},
              {$set: {username: username, name: 'Empty', email: '', age: 0, address1: '', address2: '', city: '', state: '', zip: '',image: '', membertype: 'Member', view: 'Public'}},
              {upsert: true}, ((err, data) => {
              if(err) {
                req.session.emailVerifyErrors = 'An error was generated while attempting to add account information';
                res.redirect('/');
              } else {
                console.log('success creating account settings');
                res.redirect('/');
              }
            }));
          } else {
            req.session.emailVerifyErrors = 'Keycode doesnt match';
            res.redirect('/');
          }
        } else {
          req.session.emailVerifyErrors = 'verification code doesnt exist';
          res.redirect('/');
        }

      } else {
        req.session.emailVerifyErrors = 'There was a problem finding your user account';
        res.redirect('/');
      }
    });
}