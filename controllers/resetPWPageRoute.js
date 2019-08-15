const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const emailer = require('../email/email.js');

// Set UserModel for users in the database
const UserPWReset = new mongoose.model('User', userSchema.userSchema);
passport.use(UserPWReset.createStrategy());
passport.serializeUser(UserPWReset.serializeUser());
passport.deserializeUser(UserPWReset.deserializeUser());


exports.getPWResetPageRoute = (req, res) => {
  // Reset session error parameters for clearing errors regardless of which page the user is coming from
  req.session.passwordResetErr = null;
  
  // Require the user account to be flagged for password reset AND be authenticated as active before rendering
  UserPWReset.findOne({usernameLowerCase: req.session.username}, (err, data) => {
    if(err) {
      req.session.passwordResetErr = 'There was a problem processing your password reset';
      res.redirect('/');
    } else {
      if(data) {
        // Data exists
        if(data.pwResetKeyVerified == true) {
          // Show page, authenticated to change password
          res.render('passwordreset', {
            title: 'IntuitionLog PasswordReset',
            url: 'https://www.intuitionlog.com/passwordreset',
            username: req.session.username,
            passwordResetPostErr: req.session.passwordResetPostErr,
            passwordResetErr: req.session.passwordResetErr
          });
        } else {
          // Not verified to change password, redirect with error
          req.session.passwordResetErr = 'You arent set to change your password';
          res.redirect('/');
        }
      } else {
        req.session.passwordResetErr = 'There was a problem accessing your account';
        res.redirect('/');
      }
    }
  });
}

exports.postPWResetPageRoute = (req, res) => {
  // Reset error variable
  req.session.passwordResetErr = null;
  req.session.passwordResetPostErr = null;

  // Clean input data
  // Sanitize
  req.check('newpassword').trim().escape();
  req.check('newpasswordconfirm').trim().escape();

  // Checks
  req.check('newpassword', 'New password cannot be empty').not().isEmpty();
  req.check('newpassword', 'New password must between 6 and 50 characters in length').isLength({min: 6, max: 50});
  req.check('newpassword', 'New password must contain only letters, numbers or @!#$%*+-/=?^_`{').matches(/^[A-Za-z0-9@!#$%*+-/=?^_`{]+$/i);
  req.check('newpasswordconfirm', 'Password confirmation does not match password').equals(req.body.newpassword);
  let pwResetPostErrors = req.validationErrors();

  if(pwResetPostErrors) {
    req.session.passwordResetPostErr = pwResetPostErrors;
    res.redirect('/passwordreset');
  } else {
    // Find their account and change password
    UserPWReset.findOne({usernameLowerCase: req.session.username}, (err, data) => {
      if(err) {
        req.session.passwordResetErr = 'There was an error processing your password change';
        res.redirect('/passwordreset');
      } else if(data) {
        // Account exists, check to make sure password is set to be reset
        if(data.pwResetKeyVerified == true) {
          // Password reset flag is active, go ahead with changes
            // Set password and change flag to false
            data.setPassword(req.body.newpassword, (err) => {
              if(err) {
                req.session.passwordResetErr = 'There was an error processing your password change';
                res.redirect('/passwordreset');
              } else {
                data.save();
                req.session.passwordResetPostErr = 'success';
                res.redirect('/');
              }
            });
            
        } else if(data.pwResetKeyVerified == false) {
          // Take user to password reset page to set change password reset flag and email
          req.session.passwordResetErr = 'Your account is not marked for a password reset, select reset password from the login page';
          res.redirect('/passwordreset');
        } else {
        req.session.passwordResetErr = 'Your account is not marked for a password reset';
        res.redirect('/passwordreset');
        }
      } else {
        req.session.passwordResetErr = 'There was an error finding your account information';
        res.redirect('/passwordreset');
      }
    });
  }
}