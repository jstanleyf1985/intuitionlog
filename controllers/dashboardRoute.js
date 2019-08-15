const dotenv = require('dotenv').config();
const fs = require('fs');
const sharp = require('sharp');
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const meditationSchema = require('../dbSchema/meditationschema');
const accountSchema = require('../dbSchema/accountschema');
const friendSchema = require('../dbSchema/friendschema');
const formidable = require('formidable');
const timeZoneList = require('./timeZoneData'); // Array of valid time zones
// Image and video upload support for uploads to forms
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
  secure: true
});



// Models for database manipulation (used by mongoose plugin)
const meditationDBEntry = new mongoose.model('Meditation', meditationSchema.meditationSchema);
// Set model for account settings creation
const AccountCreation = new mongoose.model('Account', accountSchema.accountSchema);
// Set model for friend creation / searching
const friendCreation = new mongoose.model('Friends', friendSchema.friendSchema)


// GETS
exports.getDashboardRoute = (req, res) => {
    
    if(req.isAuthenticated()) {
      // Render page
      res.render('dashboard', {
        title: 'IntuitionLog Dashboard',
        url: 'https://www.intuitionlog.com/dashboard',
        errors: req.session.errors,
        loginErrors: req.session.loginErrors,
        errMsg: req.session.errMsg
        });

    } else {
      res.redirect('/');
    }
  }
  // MEDITATION POSTS
  exports.postDashboardRouteMeditation = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};
    if(req.isAuthenticated()) {

      // Sanitize
      req.check('name', '').trim().escape();
      req.check('type', '').trim().escape();
      req.check('date', '').trim().escape();
      req.check('duration', '').trim().escape();
      req.check('rating', '').trim().escape();
      req.check('notes', '').trim().escape();

      // Check
      req.check('type', 'Meditation type cannot be empty').not().isEmpty();
      req.check('type', 'Meditation type must contain only letters and numbers').matches(/^[A-Za-z0-9]+$/i);

      // Check if type is in the following array
      let medTypeArr = ['Focus', 'Guided', 'LovingKindness', 'Mantra', 'Mindfulness', 'Monitoring', 'Presence', 'Qigong', 'Selfinquiry', 'Sufi', 'Taoist', 'Transcendental', 'Vipassana', 'Walking', 'Yoga', 'Zazen'];
      if(req.body.type) {
        if((req.body.type).length > 0 && typeof req.body.type == 'string') {
          if(medTypeArr.includes(req.body.type)) {
            // Do nothing, valid value
          } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}
        } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}
      } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}

      // Check duration for other errors
      req.check('duration', 'Meditation duration cannot be empty').not().isEmpty();
      req.check('duration', 'Meditation duration must contain only numbers').matches(/^[0-9]+$/i);
      req.check('duration', 'Meditation duration must be between 1 and 1440 minutes').isInt({gt: 0, lt: 1440});

      // Check if optional sections are filled out
      let ratingArr = ['0.0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];

      if(req.body.name) {
        req.check('name', 'Name cannot be empty').not().isEmpty();
        req.check('name', 'Name must be alphanumeric characters').matches(/^[A-Za-z0-9 ]+$/, 'i');
        req.check('name', 'Meditation name must be 1 - 40 characters long').isLength({min: 1, max: 40});
      }


      // Access the database, create a new meditation entry
      // Set time that goes into the database to be 0 UTC time
      let dateTime = undefined;
      let currentTime = timeZoneList.convertTimeZones('Africa/Bissau');
      if(req.body.date || req.body.time) {
        // Check if valid date
        let isValidDate = function(d) {
          return d instanceof Date && !isNaN(d);
        }

        if(req.body.date && req.body.time) {
          // If both date and time exist, create a datetime item
          dateTime = new Date(`${req.body.date}T${req.body.time}:00.000+00:00`);
          if(isValidDate(dateTime)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};
        } else if(req.body.date) {
          // If only date exists, append it with 12:00AM
          dateTime = new Date(`${req.body.date}T00:00:00.000+00:00`);
          console.log(dateTime);
          if(isValidDate(dateTime)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};
        } else if(req.body.time) {
          // Parse time, expected HH:MM
          if((typeof req.body.time) == 'string') {
            let hours = (req.body.time).slice(0, 2);
            let minutes = (req.body.time).slice(3, 5);
            let todayEdited = new Date(currentTime);
            let yearEdited = todayEdited.getFullYear();
            let monthEdited = todayEdited.getMonth();
            let dayEdited = todayEdited.getDate();

          dateTime = new Date(yearEdited, monthEdited, dayEdited, hours, minutes);
          if(isValidDate(dateTime)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};
          } else {
            meditationMsgs.dateMsg = 'Invalid Date or Time'
          }
          
        } else {

        }
      }

      if(req.body.rating) {
        if(ratingArr.includes(req.body.rating)) {
          req.check('rating', 'Rating cannot be empty').not().isEmpty();
          req.check('rating', 'Rating must contain only numbers').isNumeric();
          req.check('rating', 'Rating must be between 0 and 5').isLength({min: '1', max: '3'});
          req.check('rating', 'Rating must be a decimal value between 0 and 5').isFloat({gt: '0.0', lt: '5.1'});
          req.check('rating', 'Rating must contain only 0.0 - 5.0').matches(/^[0-5.]+$/i);
        } else {
          meditationMsgs.ratingMsg = 'Invalid rating, please try again.';
        }
      }

      if(req.body.notes) {
        if((req.body.notes).length > 0 && (req.body.notes).length < 1000) {
          req.check('notes', 'Notes cannot be empty').not().isEmpty();
          req.check('notes', 'Notes must be less than 1000 characters').isLength({min: '1', max: '1000'});
          req.check('notes', 'Notes must contain only letters, numbers or @!#$%*+-/=?^_`.{').matches(/^[A-Za-z0-9@!#$%*+-/=?^_`.'" {]+$/i);
        } else {
          meditationMsgs.notesMsg = 'Notes is not valid, please try again.';
        }
      } else {
        // Notes are empty, create a default searchable notes string for empty notes
        req.body.notes = 'Empty'
      }
      let meditationErr = req.validationErrors();
      
      // Check if there are no custom errors,
      // if no custom errors exist array is empty, send to be created
      if(meditationMsgs.length > 0 || meditationErr.length > 0) {
        // If errors exist, get a list of errors
        // Errors exist, return false
        if(meditationErr.length > 0 && meditationMsgs.length > 0) {
          return res.json({'success': false, meditationErr, meditationCustomErr});
        } else if(meditationErr.length > 0) {
          return res.json({'success': false, meditationErr});
        } else if(meditationMsgs.length > 0) {
          meditationMsgs.forEach((msg) => {
            meditationCustomErr.push(msg);
          });
          return res.json({'success': false, meditationCustomErr});
        } else {
        }
      } else {
        // Access the database, create a new meditation entry
        // Set time that goes into the database to be 0 UTC time
        let currentTime = timeZoneList.convertTimeZones('Africa/Bissau');
        currentTime = new Date(currentTime).toISOString();
        if(dateTime) {currentTime = dateTime};
        
        // If meditation name is empty, generate one using the current datetime
        let meditationName = '';
        if(req.body.name == '') {
          if(typeof currentTime == 'string') {
            meditationName = 'Meditation '.concat(String(currentTime).replace('T', ' ').substring(0, 19));
          } else if(typeof currentTime == 'object') {
            meditationName = 'Meditation '.concat(currentTime.toISOString().replace('T', ' ').substring(0, 19));
          }
          
        } else {
          meditationName = req.body.name;
        }

          // Perform meditation creation
          meditationDBEntry.create({
            username: req.session.passport.user,
            meditationName: meditationName,
            meditationType: req.body.type,
            meditationDuration: req.body.duration,
            meditationDate: currentTime,
            meditationRating: req.body.rating,
            meditationNotes: req.body.notes,
            date: currentTime}, (err, data) => {
              if(err) {
                //console.log(err);
              } else {
                //console.log('success');
              }

          });
          // No errors exist, return true
          return res.json({'success': true, meditationErr, meditationCustomErr});
      }
      
      
    } else {
      res.redirect('/');
    }
  }
  // MEDITATION ADD
  exports.postDashboardRouteMeditationView = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    if(req.isAuthenticated()) {
      if(meditationErr) {
        // Errors exist, return false
        meditationErr = {};
        meditationErr.msg = 'Failed to process, please try again';
        return res.json({'success': false, meditationErr});
      } else {
        // Access the database, return a list of meditations
        meditationDBEntry.find({username: req.session.passport.user}, (err, data) => {
          if(err) {
            meditationErr = {};
            meditationErr.msg = 'Failed to obtain information';
            return res.json({'success': false, meditationErr});
          } else if(data) {
            // Success, send data to front end
            return res.json({'success': true, data});
          } else {
            meditationErr = {};
            meditationErr.msg = 'No data found';
            return res.json({'success': false, meditationErr});
          }
          
        });
        
      }
    } else {
      res.redirect('/');
    }
  }
  // MEDITATION EDIT
  exports.postDashboardRouteMeditationEdit = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    if(req.isAuthenticated()) {
      if(meditationErr) {
        // Errors exist, return false
        meditationErr = {};
        meditationErr.msg = 'Failed to process, please try again';
        return res.json({'success': false, meditationErr});
      } else {
        // Access the database, return a list of meditations
        meditationDBEntry.findOne({$and: [{_id: req.body.id}, {username: req.session.passport.user}]}, (err, data) => {
          if(err) {
            meditationErr = {};
            meditationErr.msg = 'Failed to obtain information';
            return res.json({'success': false, meditationErr});
          } else if(data) {
            // Success, send data to front end
            return res.json({'success': true, data});
          } else {
            meditationErr = {};
            meditationErr.msg = 'No data found';
            return res.json({'success': false, meditationErr});
          }
          
        });
        
      }
    } else {
      res.redirect('/');
    }
  }
  // MEDITATION EDIT SUBMITTED
  exports.postDashboardRouteMeditationEditSubmit = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};
    if(req.isAuthenticated()) {

      // Sanitize
      req.check('_id', '').trim().escape();
      req.check('name', '').trim().escape();
      req.check('type', '').trim().escape();
      req.check('date', '').trim().escape();
      req.check('time', '').trim().escape();
      req.check('duration', '').trim().escape();
      req.check('rating', '').trim().escape();
      req.check('notes', '').trim().escape();

      // Check
      req.check('id', 'ID cannot be empty').not().isEmpty();
      req.check('id', 'ID must contain only letters and numbers').matches(/^[A-Za-z0-9]+$/i);
      req.check('type', 'Meditation type cannot be empty').not().isEmpty();
      req.check('type', 'Meditation type must contain only letters and numbers').matches(/^[A-Za-z0-9]+$/i);
      req.check('duration', 'Meditation duration cannot be empty').not().isEmpty();
      req.check('duration', 'Meditation duration must contain only numbers').matches(/^[0-9]+$/i);
      req.check('duration', 'Meditation duration must be between 1 and 1440 minutes').isInt({gt: 0, lt: 1440});

      // Check if optional sections are filled out
      let ratingArr = ['0.0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];
      if(req.body.name) {
        req.check('name', 'Name cannot be empty').not().isEmpty();
        req.check('name', 'Name must be alphanumeric').matches(/^[A-Za-z0-9 ]+$/, 'i');
        req.check('name', 'Meditation name must be 1 - 40 characters long').isLength({min: 1, max: 40});
      }

      // Check if type is in the following array
      let medTypeArr = ['Focus', 'Guided', 'LovingKindness', 'Mantra', 'Mindfulness', 'Monitoring', 'Presence', 'Qigong', 'Selfinquiry', 'Sufi', 'Taoist', 'Transcendental', 'Vipassana', 'Walking', 'Yoga', 'Zazen'];
      if(req.body.type) {
        if((req.body.type).length > 0 && typeof req.body.type == 'string') {
          if(medTypeArr.includes(req.body.type)) {
            // Do nothing, valid value
          } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}
        } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}
      } else {meditationMsgs.typeMsg = 'Invalid Meditation Type';}

      // Access the database, create a new meditation entry
      // Set time that goes into the database to be 0 UTC time
      let dateTimeEdited = undefined;
      let currentTime = timeZoneList.convertTimeZones('Africa/Bissau');
      if(req.body.date || req.body.time) {
        // Check if valid date
        let isValidDate = function(d) {
          return d instanceof Date && !isNaN(d);
        }

        if(req.body.date && req.body.time) {
          // If both date and time exist, create a datetime item
          dateTimeEdited = new Date(`${req.body.date}T${req.body.time}:00.000+00:00`);
        } else if(req.body.date) {
          // If only date exists, append it with 12:00AM
          dateTimeEdited = new Date(`${req.body.date}T00:00:00.000+00:00`);
          if(isValidDate(dateTimeEdited)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};
        } else if(req.body.time) {
          // Parse time, expected HH:MM
          if((typeof req.body.time) == 'string') {
            let hours = (req.body.time).slice(0, 2);
            let minutes = (req.body.time).slice(3, 5);
            let todayEdited = new Date(currentTime);
            let yearEdited = todayEdited.getFullYear();
            let monthEdited = todayEdited.getMonth();
            let dayEdited = todayEdited.getDate();

          dateTimeEdited = new Date(yearEdited, monthEdited, dayEdited, hours, minutes);
          if(isValidDate(dateTimeEdited)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};
          } else {
            meditationMsgs.dateMsg = 'Invalid Date or Time'
          }
          
        } else {

        }
      }
      

      if(req.body.rating) {
        if(ratingArr.includes(req.body.rating)) {
          req.check('rating', 'Rating cannot be empty').not().isEmpty();
          req.check('rating', 'Rating must contain only numbers').isNumeric();
          req.check('rating', 'Rating must be between 0 and 5').isLength({min: '1', max: '3'});
          req.check('rating', 'Rating must be a decimal value between 0 and 5').isFloat({gt: '0.0', lt: '5.1'});
          req.check('rating', 'Rating must contain only 0.0 - 5.0').matches(/^[0-5.]+$/i);
        } else {
          meditationMsgs.ratingMsg = 'Invalid rating, please try again.';
        }
      }

      if(req.body.notes) {
        if((req.body.notes).length > 0 && (req.body.notes).length < 1000) {
          req.check('notes', 'Notes cannot be empty').not().isEmpty();
          req.check('notes', 'Notes must be less than 1000 characters').isLength({min: '1', max: '1000'});
          req.check('notes', 'Notes must contain only letters, numbers or @!#$%*+-/=?^_`.{').matches(/^[A-Za-z0-9@!#$%*+-/=?^_`.'" {]+$/i);

        } else {
          if(req.body.notes == '' || req.body.notes == null || req.body.notes == undefined) {
            req.body.notes = 'Empty';
          } else {
            meditationMsgs.notesMsg = 'Notes is not valid, please try again.';
          }
          
        }
      } else {
        if(req.body.notes == '' || req.body.notes == null || req.body.notes == undefined) {
          req.body.notes = 'Empty';
        } else {
          meditationMsgs.notesMsg = 'Notes is not valid, please try again.';
        }
      }
      let meditationErr = req.validationErrors();
      // Check if there are no custom errors,
      // if no custom errors exist array is empty, send to be created
      if(meditationMsgs.length > 0 || meditationErr.length > 0) {
        // If errors exist, get a list of errors
          // Errors exist, return false
        if(meditationErr.length > 0 && meditationMsgs.length > 0) {
          return res.json({'success': false, meditationErr, meditationCustomErr});
        } else if(meditationErr.length > 0) {
          return res.json({'success': false, meditationErr});
        } else if(meditationMsgs.length > 0) {
          meditationMsgs.forEach((msg) => {
            meditationCustomErr.push(msg);
          });
          return res.json({'success': false, meditationCustomErr});
        } else {
        }
      } else {

        // If meditation name is empty, generate one using the current datetime
        let meditationName = '';
        if(req.body.name == '') {
          meditationName = 'Meditation '.concat(currentTime.toString());
        } else {
          meditationName = req.body.name;
        }

        // Check if time exists, if so assign currentTime to dateTimeEdited
        // dateTimeEdited is created from a valid date or
        if(dateTimeEdited) {currentTime = dateTimeEdited};

        meditationDBEntry.replaceOne({
          _id: req.body.id, username: req.session.passport.user}, {
          username: req.session.passport.user,
          meditationName: meditationName,
          meditationType: req.body.type,
          meditationDuration: req.body.duration,
          meditationDate: currentTime,
          meditationRating: req.body.rating,
          meditationNotes: req.body.notes,
          date: currentTime}, (err, data) => {
            if(err) {
              //console.log(err);
            } else if(data) {
              // All checks out, perform adjustment
              return res.json({'success': true});
            } else {
              // Do nothing
            }

        });
      }
  }
  }
  // MEDITATION QUICK VIEW
  exports.postDashboardRouteMeditationQuickView = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};

    // Set data to return post query data
    let username = (String(req.session.passport.user)).toLowerCase();
    if(req.isAuthenticated()) {
      meditationDBEntry.find({username: username}, {_id: 0, username: 0}, {limit: 10, sort: {meditationDate: -1}}, function(err, data) {
        if(err) {
          return res.json({'success': false, 'errMsg': 'There was an error retrieving your meditations'});
        } else if(data) {
          if(typeof data == 'object') {
            if(Object.keys(data).length > 0) {
              return res.json({'success': true, 'data': data});
            } else {return res.json({'success': false, 'results': false})}; 
          } else {return res.json({'success': false, 'results': false})};
        } else {
          return res.json({'success': false, 'results': false});
        }
      });
      
    }
  }
  // MEDITATION REPORTS
  exports.postDashboardRouteMeditationReports = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};

    // Set data to return post query data
    let username = (String(req.session.passport.user)).toLowerCase();
    if(req.isAuthenticated()) {
      // Set initial variables for database usage
      let typeSelected = ['Focus', 'Guided', 'Loving Kindness', 'Mantra', 'Mindfulness', 'Monitoring', 'Presence', 'Self-Inquiry', 'Sufi', 'Taoist', 'Transcendental', 'Vipassana', 'Walking', 'Yoga', 'Zazen'];
      let dateFrom = '1990-01-01T00:00:00.000+00:00Z';
      let dateTo = '2100-12-31T23:59:59.000+00:00Z';
      let ratingFrom = '0';
      let ratingTo = '5';
      let durationFrom = '1';
      let durationTo = '1440';
      let keyword = '';
      let sortFilter = 'None';
      let orderFilterA = 'None';
      let orderFilterB = 'Ascending';

      // Function to check if date is valid
      let isValidDate = function(d) {
        return d instanceof Date && !isNaN(d);
      }

      // Sanitize
      req.check('typeSelected', '').trim().escape();
      req.check('dateFrom', '').trim().escape();
      req.check('dateTo', '').trim().escape();
      req.check('ratingFrom', '').trim().escape();
      req.check('ratingTo', '').trim().escape();
      req.check('durationFrom', '').trim().escape();
      req.check('durationTo', '').trim().escape();
      req.check('keyword', '').trim().escape();
      req.check('sortFilter', '').trim().escape();
      req.check('orderFilterA', '').trim().escape();
      req.check('orderFilterB', '').trim().escape();

      //CHECK TYPE - if nothing is entered keep value set to null, else set value to array of selections
      if(req.body.typeSelected) {
        if(typeof req.body.typeSelected == 'object') {
          if(req.body.typeSelected.length > 0 && req.body.typeSelected.length < 50) {
            let typeSelectedArr = ['Focus', 'Guided', 'Loving Kindness', 'Mantra', 'Mindfulness', 'Monitoring', 'Presence', 'Self-Inquiry', 'Sufi', 'Taoist', 'Transcendental', 'Vipassana', 'Walking', 'Yoga', 'Zazen'];
            let typeSelectedErrors = [];
            // Check for errors by iterating through array of valid options vs provided options
            // If invalid options exist, throw error
            for(let a = 0; a < req.body.typeSelected.length; a++) {
              if(typeSelectedArr.includes(req.body.typeSelected[a]) == false) {
                typeSelectedArrors.push(req.body.typeSelected[a]);
              }
            }

            if(typeSelectedErrors.length > 0) {
              return res.json({'success': false, 'errMSG': 'Type contains unexpected values'});
            } else {
              // Success no errors
              typeSelected = typeSelectedArr;
            }
          } else {
            return res.json({'success': false, 'errMSG': 'Type must be fewer than 50 selections'});
          }
        } else {
          return res.json({'success': false, 'errMSG': 'Type of typeSelected must be object'});
        }
      } else {
        // Type selected was an empty array, never reaches req.body, assign all possible values
        req.body.typeSelected = ['Focus', 'Guided', 'Loving Kindness', 'Mantra', 'Mindfulness', 'Monitoring', 'Presence', 'Self-Inquiry', 'Sufi', 'Taoist', 'Transcendental', 'Vipassana', 'Walking', 'Yoga', 'Zazen'];
      }

      //CHECK DATE - if nothing is entered throw error - required values
      if(req.body.dateFrom) {
        if(req.body.dateTo) {
          if(typeof req.body.dateFrom == 'string' && typeof req.body.dateTo == 'string') {
            try {
              //Convert dateTo to end of day 23:59:59:999
              let tempDate = req.body.dateTo.split('-');
              dateTo = new Date(tempDate[0], tempDate[1], tempDate[2], '23', '59', '59');
              dateFrom = new Date(req.body.dateFrom);

              if(isValidDate(dateTo) && isValidDate(dateFrom)) {
                // Compare the 2 days, make sure dateFrom < dateTo
                if(dateFrom < dateTo) {
                  // Success, now convert back to strings in ISO format
                  dateTo = dateTo.toISOString();
                  dateFrom = dateFrom.toISOString();
                } else {
                  return res.json({'success': false, 'errMSG': '1st date must be earlier than the 2nd date'});
                }

              } else {return res.json({'success': false, 'errMSG': 'Date must be in a valid format'});}
            } catch {
              return res.json({'success': false, 'errMSG': 'Date must be in a valid format'});
            }
          } else {return res.json({'success': false, 'errMSG': 'Date must be a valid type'});}
        } else {return res.json({'success': false, 'errMSG': 'Date must not be empty'});}
      } else {return res.json({'success': false, 'errMSG': 'Date must not be empty'});}

      //CHECK RATING - if nothing is entered keep value set to null, else set value
      if(req.body.ratingFrom) {
        if(req.body.ratingTo) {
          let ratingArr = ['0.0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '0', '1', '2', '3', '4', '5'];
          if(ratingArr.includes(req.body.ratingFrom) && ratingArr.includes(req.body.ratingTo)) {
            // Convert them to floats and compare the values, ratingFrom must be less than ratingTo
            try {
              ratingFrom = parseFloat(req.body.ratingFrom);
              ratingTo = parseFloat(req.body.ratingTo);

              if(ratingFrom <= ratingTo) {
                // Valid
              } else {return res.json({'success': false, 'errMSG': 'Rating must have a lower or equal starting value'});}
            } catch {
              return res.json({'success': false, 'errMSG': 'Rating must be valid number from 0 - 5. Example: 3.5'});
            }
          } else {
            return res.json({'success': false, 'errMSG': 'Rating must be valid number from 0 - 5. Example: 3.5'});
          }
          
        }
      }

      //CHECK DURATION - if nothing is entered keep value set to null, else set value
      if(req.body.durationFrom) {
        if(req.body.durationTo) {
          // Make sure its a valid number
          req.check('durationFrom', 'Duration must be a number from 0 - 1440').isInt({gt: 0, lt: 1441});
          req.check('durationTo', 'Duration must be a number from 0 - 1440').isInt({gt: 0, lt: 1441});
          req.check('durationFrom', 'Duration must only contain whole numbers').matches(/^[0-9]+$/i);
          req.check('durationTo', 'Duration must only contain whole numbers').matches(/^[0-9]+$/i);
          try {
            // convert duration to int to compare and check if betweene expected numerical values
            durationFrom = parseInt(req.body.durationFrom);
            durationTo = parseInt(req.body.durationTo);

            if((durationFrom >= 0 && durationFrom <= 1440 && durationTo >= 0 && durationFrom <= 1440)) {
              // Check to make sure durationFrom is lower than or equal to durationTo
              if(durationFrom <= durationTo) {
                // No errors, valid information for data submissions
              } else {
                return res.json({'success': false, 'errMSG': 'Must have a lower beginning duration than ending duration'});
              }
            } else {return res.json({'success': false, 'errMSG': 'Duration must be a whole number 0 - 1440'});}
          } catch {
            return res.json({'success': false, 'errMSG': 'Duration must be a whole number 0 - 1440'});
          }
        }
      }

      //CHECK KEYWORD - if nothing is entered keep value set to null, else set value
      if(req.body.keyword) {
        if(typeof req.body.keyword == 'string') {
          req.check('keyword', 'Keywords must be fewer than 255 characters long').isLength({min: 1, max: 254});
          req.check('keyword', 'Keywords must contain letters, numbers and commas').matches(/^[a-zA-Z0-9 ,]+$/i);

          // Parse list using commas, into an array of values
          try {
            if(req.body.keyword.includes(',')) {
              // Contains multiple values, create an array with keywords
              let keywordSplit = req.body.keyword.split(',');

              // Create filter
              let trimKeywords = function(arrItem) {
                return arrItem.trim();
              }

              // Filter trim each item in the array
              keyword = keywordSplit.map(trimKeywords);
            } else {
              // Contains only 1 value, keep as a string
              keyword = req.body.keyword;
            }
          } catch {
            return res.json({'success': false, 'errMSG': 'Error: use only words with comma separated values'});
          }
        } else {return res.json({'succcess': false, 'errMSG': 'Keyword must be a string'});}
      }

      //CHECK SORT - if nothing is entered throw err, required
      if(req.body.sortFilter) {
        if(typeof req.body.sortFilter == 'string') {
          req.check('sortFilter', 'Sort must be filled in').not().isEmpty();

          // Check if sort is in an array of acceptable values
          let sortArr = ['None', 'Name', 'Date', 'Duration', 'Rating', 'Keyword'];
          if(sortArr.includes(req.body.sortFilter)) {
            // Value expected, continue
            sortFilter = req.body.sortFilter;
          } else {
            // Value not expected, throw error
            return res.json({'success': false, 'errMSG': 'Sort must be one of the available selections'});
          }
        } else {
          return res.json({'success': false, 'errMSG': 'Sort must contain one selection only'});
        }
        
      } else {return res.json({'success': false, 'errMSG': 'Sort is required'});}

      //CHECK ORDER FILTER - if nothing is entered throw err, required
      if(req.body.orderFilterA) {
        if(req.body.orderFilterB) {
          if(typeof req.body.orderFilterA == 'string' && typeof req.body.orderFilterB == 'string') {
            //req.check('orderFilterA', 'Order is required').not().isEmpty();
            req.check('orderFilterB', 'Order is required').not().isEmpty();

            // Make sure order is an expected value
            let orderFilterAArr = ['None', 'Name', 'Date', 'Durations', 'Rating', 'Keyword'];
            let orderFilterBArr = ['Ascending', 'Descending'];

            if(orderFilterAArr.includes(req.body.orderFilterA) && orderFilterBArr.includes(req.body.orderFilterB)) {
              // Success, assign values
              orderFilterA = req.body.orderFilterA;
              orderFilterB = req.body.orderFilterB;

              // orderFilterA is not used at this time
              if(orderFilterB == 'Ascending') {orderFilterB = '1';} else if(orderFilterB == 'Descending') {orderFilterB == '-1';} else {}
            } else {return res.json({'success': false, 'errMSG': 'Order must contain one of the selection values'});}
          } else {return res.json({'success': false, 'errMSG': 'Order must contain only 1 value per selection'});}
        } else {return res.json({'success': false, 'errMSG': 'Order is required'});}
      } else {return res.json({'success': false, 'errMSG': 'Order is required'});}

      // Create a variable to contain validation errors from expressvalidator
      let validationErr = req.validationErrors();


      // If valiation errors exist, return error to front end
      if(req.validationErrors()) {
        // Errors exist, send success = false
        return res.json({'success': false, 'validationErr': validationErr});
      } else {
        // No errors, query the database with information provided
          // Keyword was left blank, skip and run normaly query, else run keyword query and filter results
          // Get values submitted and return them for report functionality
          let submittedValues = {
            typeSelected: typeSelected,
            dateFrom: dateFrom,
            dateTo: dateTo,
            ratingFrom: ratingFrom,
            ratingTo: ratingTo,
            durationFrom: durationFrom,
            durationTo: durationTo,
            keyword: keyword,
            sortby: sortFilter,
            orderby: orderFilterB
          };

          console.log(submittedValues);
          // Convert typeSelected object to array, and keyword to a string
          let typeToArr = [];
          let keywordToArr = [];

          // Convert type
          if(typeof typeSelected == 'object') {
            try {
              for(typeItem in typeSelected) {
                typeToArr.push(typeSelected[typeItem]);
              }
            } catch {return res.json({'success': false, 'errMSG': 'Failed to convert type to object'});}
          } else if(typeof typeSelected == 'string') {typeToArr.push(typeSelected);}

          // Convert keywords
          if(typeof keyword == 'object') {
            try {
              for(keywordItem in keyword) {
                keywordToArr.push(keyword[keywordItem]);
              }
              // Convert array to string
              keyword = keywordToArr.join(' ');
            } catch {return res.json({'success': false, 'errMSG': 'Failed to convert keywords to a string'});}
          } else if(typeof keyword == 'string') {
            try {
              keyword = keyword.toString();
            } catch {return res.json({'success': false, 'errMSG': 'Failed to convert keywords to a string'});}
          }
          
          // If keyword is empty, run query without keyword field
          // keyword searching is not able to catch *any* text, or use a regex check in an text index search
          if(keyword) {
            meditationDBEntry.find({$and: [
              {username: username},
              {meditationType: {$in: typeToArr}},
              {$and: [{meditationRating: {$gte: `${ratingFrom}`, $lte: `${ratingTo}`}}]},
              {$and: [{meditationDate: {$gte: `${dateFrom}`, $lte: `${dateTo}`}}]},
              {$and: [{meditationDuration: {$gte: `${durationFrom}`, $lte: `${durationTo}`}}]},
              {$text: {$search: keyword}}
            ]}, {_id: 0, username: 0}, {limit: 1000, sort: {sortFilter: orderFilterB}}, function(err, data) {
            if(err) {
              return res.json({'success': false, 'errMSG': 'There was an error processing your request'});
            } else if(data) {
              return res.json({'success': true, 'data': data, 'submittedValues': submittedValues});
            } else {
              return res.json({'success': false, 'errMSG': 'No data found'});
            }
            });
          } else {
            meditationDBEntry.find({$and: [
              {username: username},
              {meditationType: {$in: typeToArr}},
              {$or: [{meditationRating: {$gte: `${ratingFrom}`, $lte: `${ratingTo}`}}, {meditationRating: {$in: [null]}}]},
              {$and: [{meditationDate: {$gte: `${dateFrom}`, $lte: `${dateTo}`}}]},
              {$and: [{meditationDuration: {$gte: `${durationFrom}`, $lte: `${durationTo}`}}]}
            ]}, {_id: 0, username: 0}, {limit: 1000, sort: {sortFilter: orderFilterB}}, function(err, data) {
            if(err) {
              console.log(err);
              return res.json({'success': false, 'errMSG': 'There was an error processing your request'});
            } else if(data) {
              return res.json({'success': true, 'data': data, 'submittedValues': submittedValues});
            } else {
              return res.json({'success': false, 'errMSG': 'No data found'});
            }
            });
          }
        
      }
    }
  }
  // MEDITATION DELETE
  exports.postDashboardRouteMeditationDelete = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};
    if(req.isAuthenticated()) {
      if(meditationErr) {
        // Errors exist, return false
        meditationErr = {};
        meditationErr.msg = 'Failed to process, please try again';
        return res.json({'success': false, meditationErr});
      } else {
        // Access the database, return a list of meditations
        meditationDBEntry.findOne({$and: [{_id: req.body.id}, {username: req.session.passport.user}]}, (err, data) => {
          if(err) {
            meditationErr = {};
            meditationErr.msg = 'Failed to obtain information';
            return res.json({'success': false, meditationErr});
          } else if(data) {
            // Success, now delete entry
            meditationDBEntry.findOneAndDelete({$and: [{_id: req.body.id}, {username: req.session.passport.user}]}, (err, data) => {
              if(err) {
                meditationErr = {};
                meditationErr.msg = 'Failed to obtain information';
                return res.json({'success': false, meditationErr});
              } else if(data) {
                // Successful deletion of items
                return res.json({'success': true});
              } else {
                meditationErr = {};
                meditationErr.msg = 'No data found to delete for the selected meditation';
                return res.json({'success': false, meditationErr});
              }
            });
          } else {
            meditationErr = {};
            meditationErr.msg = 'No data found';
            return res.json({'success': false, meditationErr});
          }
          
        });
        
      }
    } else {
      res.redirect('/');
    }
  }
  // PROVIDE MEDITATION REPORT DATA FOR DASHBOARD
  exports.postDashboardRouteMeditationChart = (req, res) => {
    // Reset validation errors
    let meditationErr = null;
    let meditationCustomErr = [];
    let meditationMsgs = {};

    if(req.isAuthenticated()) {
      // Check to see if req.body.meditationToday is a valid date
      req.check('meditationToday', '').trim().escape();
      req.check('meditationToday', 'Todays date cannot be empty').not().isEmpty();
      req.check('meditationToday', 'Todays date must contain only a valid time').matches(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);
      
      // Assign errors to meditationErr
      let meditationErr = req.validationErrors();
      // check if valid date
      // Check if valid date
      let isValidDate = function(d) {return d instanceof Date && !isNaN(d);}
      if(isValidDate(req.body.meditationToday)) {} else {meditationMsgs.dateMsg = 'Invalid Date or Time';};

      // Note: No need to actually send the error objects, this is in case someone bypasses date information in javascript
      if(meditationErr.length > 0 && meditationMsgs.length > 0) {
        // Both errors exist, fail and send response for both errors
        res.json({'success': false, meditationErr, meditationMsgs});
      } else if(meditationErr.length > 0) {
        // Meditation Errors exist, fail and send response
        res.json({'success': false, meditationErr});
      } else if(meditationMsgs.length > 0) {
        // MeditationMsgs Errors exist, fail and send response
        res.json({'success': false, meditationMsgs});
      } else {
        // Success, take todays date and check the past 7 dates for meditation entries
        if((typeof req.body.meditationToday) == 'string') {
          let meditationToday_D = new Date(req.body.meditationToday);
          // Create an array to hold the today 11:59PM and 7 days ago 00AM to use for DB query
          // which finds the last 7 days of meditations and returns their times and hours for the report
  
            // Generate beginning / end dates for each item in the meditationDays object
            let meditationDaysBegin = [];
            let meditationDaysEnd = [];

            let generateMeditationDays = (date, daysAgo) => {
              // Do this once for current day
              meditationDaysBegin[0] = new Date(date.setDate(date.getDate() -0)).toISOString().slice(0, 10).concat('T00:00:00.000+00:00');
              meditationDaysEnd[0] = new Date(date.setDate(date.getDate() -0)).toISOString().slice(0, 10).concat('T23:59:59.000+00:00');

              // Then do this for the rest of the loop
              for(let a = 1; a <= daysAgo; a++) {
                meditationDaysBegin[a] = new Date(date.setDate(date.getDate() -1)).toISOString().slice(0, 10).concat('T00:00:00.000+00:00');
                meditationDaysEnd[a] = new Date(date.setDate(date.getDate() -0)).toISOString().slice(0, 10).concat('T23:59:59.000+00:00');
              }
            }

            // Returns 2 arrays, [0] = array of beginning days, [1] = array of ending days
            generateMeditationDays(meditationToday_D, 7);
            

            // return matched entries for the past 7 days and username equals logged in user
            // Make sure both arrays are equal lengths to ensure an accurate matching of date ranges
            if(meditationDaysBegin.length == meditationDaysEnd.length) {
              meditationDBEntry.find({
                "meditationDate": {
                    "$gt": meditationDaysBegin[meditationDaysBegin.length -1],
                    "$lt": meditationDaysEnd[0]
                },
                "username": req.session.passport.user
                }, {
                    "meditationDuration": 1,
                    "date": 1
                }, (err, data) => {
                if(err) {
                  console.log(err);
                  return res.json({'success': false});
                } else if(data) {
                  // data is an array of objects, we know the days will be limited to 7 at this time, so perform 6 checks for each item iterated
                  let meditationDay0Arr = [];
                  let meditationDay1Arr = [];
                  let meditationDay2Arr = [];
                  let meditationDay3Arr = [];
                  let meditationDay4Arr = [];
                  let meditationDay5Arr = [];
                  let meditationDay6Arr = [];

                  data.forEach((item) => {
                    // new Date is the item.date object converted into a format that can be compared
                    let newDate = new Date(item.date).toISOString().concat('+00:00Z');
                    if(newDate > meditationDaysBegin[0] && newDate < meditationDaysEnd[0]) {
                      meditationDay0Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[1] && newDate < meditationDaysEnd[1]) {
                      meditationDay1Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[2] && newDate < meditationDaysEnd[2]) {
                      meditationDay2Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[3] && newDate < meditationDaysEnd[3]) {
                      meditationDay3Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[4] && newDate < meditationDaysEnd[4]) {
                      meditationDay4Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[5] && newDate < meditationDaysEnd[5]) {
                      meditationDay5Arr.push(item.meditationDuration);
                    } else if(newDate > meditationDaysBegin[6] && newDate < meditationDaysEnd[6]) {
                      meditationDay6Arr.push(item.meditationDuration);
                    } else {}
                  });

                  return res.json({'success': true, meditationDay0Arr, meditationDay1Arr, meditationDay2Arr, meditationDay3Arr, meditationDay4Arr, meditationDay5Arr, meditationDay6Arr});
                } else {
                  // Unable to find data
                  console.log('unable to find data');
                  return res.json({'success': false});
                }
              });
            }
            
        }
        
        
      }
      
    } else {
      return res.redirect('/');
    }
  }
  // FRIENDS LIST CONTROLLER
  exports.postDashboardRouteFriends = (req, res) => {
    if(req.isAuthenticated()) {
      let username = (String(req.session.passport.user)).toLowerCase();
      friendCreation.findOne({usernameLowerCase: username}, function(err, data) {
        if(err) {
          return res.json({'success': false, 'errMSG': 'Error in locating friend records'});
        } else if(data) {
          if(Object.keys(data).length > 0) {
            // Send data back to front end
            // Send only the array of friends data[0].friends
            res.json({'success': true, frResults: data.friends});
          } else {return res.json({'success': false, 'errMSG': 'Error in locating friend records'});}
        } else {
          // No records exist for this username, create a blank record
          friendCreation.create({usernameLowerCase: username, friends: []}, function(err, data) {
            if(err) {
              console.log(err);
              res.json({'success': false, 'errMSG': 'Error creating friends records'});
            } else if(data) {
              if(Object.keys(data).length > 0) {
                // Results found, send to front end
                return res.json({'success': true});
              } else {res.json({'success': false, 'errMSG': 'There was an error creating your friends list'});}
            } else {res.json({'success': false, 'errMSG': 'Error in locating created friends record'});}
          });
        }
      });
    } else {
      res.redirect('/');
    }
  }
  // FRIENDS LIST CONTROLLER FIND
  exports.postDashboardRouteFriendFind = (req, res) => {
    if(req.isAuthenticated()) {
      // Clean searchStr
      req.check('searchStr', '').trim().escape();
      req.check('searchStr', 'Search must contain numbers and letters only').matches(/^[A-Za-z0-9]+$/i);
      req.check('searchStr', 'Search must not be empty').not().isEmpty();
      req.check('searchStr', 'Search must be fewer than 50 characters').isLength({min: 1, max: 51});
      let validationErr = req.validationErrors();

      // Check if validation errors are present, if so do not process request and return error
      if(validationErr) {
        return res.json({'success': false, 'errMSG': 'There was a validation error, please try again'});
      } else {
        let friendsListStr = '';
        let username = (String(req.session.passport.user)).toLowerCase();
        // Find and create an array of friends, use the array to exclude people already included in the users friends list
        friendCreation.findOne({'usernameLowerCase': username}, function(err, frList) {
          if(err) {return res.json({'success':false, 'errMSG': 'Unable to locate friends list'});}
          else if(frList) {
            try {

              // Create string using friendsList results
              friendsListStr = String(frList.friends);
              let friendsListArr = friendsListStr.split(',');
              
              // Check if friends list has at least one value, if not exclude the $nin check
              if(friendsListArr[0] == '' || friendsListArr[0] == null || friendsListArr[0] == undefined) {
                // Display every match, no need to check for friends already in your friends list
                // Display every match excluding those already in friends list and 'Empty' default value
                AccountCreation.find({$and: [{'view': 'Public'}, {'name': {$ne: 'Empty'}}]
                }, {username: 0, address1: 0, address2: 0, age: 0, city: 0, email: 0, state: 0, zip: 0}, {limit: 1000}, function(err, data) {
                if(err) {console.log(err);res.json({'success': false, errMSG: err.message});}
                else if(data) {
                  if(Object.keys(data).length > 0) {
                    console.log(data);
                    res.json({'success': true, frFindResults: data});
                  } else {res.json({'success': false, errMSG: 'No entries found'});}
                } else {res.json({'success': false, errMSG: 'No entries found'});}
                });
              } else {
                // Display every match excluding those already in friends list and 'Empty' default value
                AccountCreation.find({$and: [{'view': 'Public'}, {'name': {$ne: 'Empty'}}, {'_id': {$nin: friendsListArr}}]
                }, {username: 0, address1: 0, address2: 0, age: 0, city: 0, email: 0, state: 0, zip: 0}, {limit: 1000}, function(err, data) {
                if(err) {console.log(err);res.json({'success': false, errMSG: err.message});}
                else if(data) {
                  if(Object.keys(data).length > 0) {
                    console.log(data);
                    res.json({'success': true, frFindResults: data});
                  } else {res.json({'success': false, errMSG: 'No entries found'});}
                } else {res.json({'success': false, errMSG: 'No entries found'});}
                });
              }

            } catch {return res.json({'success': false, 'errMSG': 'Unable to parse friend data lookup'});}
          } else {return res.json({'success': false, 'errMSG': 'Unable to locate friend records'});}
        });
      }

    }
  }
  // FRIENDS LIST ADD
  exports.postDashboardRouteFriendAdd = (req, res) => {
    if(req.isAuthenticated()) {
      let username = (String(req.session.passport.user)).toLowerCase();
      // Make sure the person exists, then add their ID to the friend list DB entry for the current user
      req.check('friendID', '').trim().escape();
      req.check('friendID', 'Todays date cannot be empty').not().isEmpty();
      req.check('friendID', 'ID must contain only alphanumeric characters').matches(/^[A-Za-z0-9]+$/i);
      let validationErr = req.validationErrors();

      // Checking to make sure friendID is a valid ID
      AccountCreation.find({_id: req.body.friendID}, {limit: 1}, function(err, accData) {
        if(err) {return res.json({'success': false, errMSG: 'There is an error locating account'});}
        else if(accData) {
          try {
            if(Object.keys(accData).length > 0) {
              // friendID is a valid account, now search for friends list to determine if they're already added
              friendCreation.findOne({$and: [{'usernameLowerCase': username, 'friends': req.body.friendID}]}, function(err, frData) {
                if(err) {return res.json({'success': false, 'errMSG': 'There was an error processing this request'});}
                else if(frData) {
                  try {
                    if(Object.keys(frData).length > 0) {
                      // friendID already exists, send message back indicating the record already exists in their friends list
                      return res.json({'success': false, 'errMSG': 'The selected friend already exists in your friends list'});
                    } else {return res.json({'success': false, 'errMSG': 'There was a problem locating friend data'});}
                  } catch {return res.json({'success': false, 'errMSG': 'There was a problem parsing friend data'});}
                } else {
                  // friendID DOES NOT EXIST already, add them to the friends list of the current logged in user
                  friendCreation.updateOne({'usernameLowerCase': username}, {
                    $push: {friends: req.body.friendID}
                  }, function(err, frListUpdate) {
                    if(err) {return res.json({'success': false, 'errMSG': 'There was an error updating your friends list'});}
                    else if(frListUpdate) {
                      try {
                        // Send confirmation back to the client
                        return res.json({'success': true});
                      } catch {return res.json({'success': false, 'errMSG': 'There was an error parsing friend list data'});}
                    } else {return res.json({'success': false, 'errMSG': 'There was an error locating data for friends list'});}
                  });
                  
                }
              });
              
            }
          } catch {
            return res.json({'success': false, errMSG: 'There is an error locating account'});
          }
        } else {return res.json({'success': false, errMSG: 'There was a problem locating account'});}
      });
      
    }
  }
  // READING POSTS
  exports.postDashboardRouteReadings = (req, res) => {
    if(req.isAuthenticated()) {
      // POST DATA
      let type = req.body.type;
      let duration = req.body.duration;
      return res.json({'type': type, 'duration': duration});
    } else {
      res.redirect('/');
    }
  }

  // CIRCLES POSTS
  exports.postDashboardRouteCircles = (req, res) => {
    if(req.isAuthenticated()) {
      // POST DATA
      return res.json({'hello': 'world'});
    } else {
      res.redirect('/');
    }
  }

  // NOTES POSTS
  exports.postDashboardRouteNotes = (req, res) => {
    if(req.isAuthenticated()) {
      // POST DATA
      return res.json({'hello': 'world'});
    } else {
      res.redirect('/');
    }
  }

  // SETTINGS POSTS
  exports.postDashboardRouteSettings = (req, res) => {
    if(req.isAuthenticated()) {
      // POST DATA
      return res.json({'hello': 'world'});
    } else {
      res.redirect('/');
    }
  }

  // ACCOUNT POSTS
  exports.postDashboardRouteAccount = (req, res) => {
    if(req.isAuthenticated()) {
      // POST DATA
      let username = (String(req.session.passport.user)).toLowerCase();
      let meditationInfo = {};
      AccountCreation.findOne({'username': username}, (err, data) => {
        if(err) {
          return res.json({'success': false, 'errMsg': 'There was an error in the system'});
        } else if(data) {
          if(Object.keys(data).length > 0) {
            // Data found, now find meditation data and return the object
            meditationDBEntry.find({username: username}, {_id: 0, meditationDuration: 1}, (err, medData) => {
              if(err) {
                // throw error
                return res.json({'success': false, 'errMsg': 'There was an error with data retrieval, contact the admin'});
              } else if(medData) {
                if(medData.length > 0) {
                  let medDurTotal = 0;
                  // get total meditations
                  meditationInfo.totalMeds = medData.length;
                  meditationInfo.medDurTotal = medDurTotal;
                  // get total of meditation durations
                  medData.forEach(function(meditation) {
                    medDurTotal = medDurTotal + meditation.meditationDuration;
                  });
                  return res.json({'success': true, 'data': data, 'info': meditationInfo});
                } else {
                  // No data found, send back 0 as the values
                  meditationInfo.totalMeds = 0;
                  meditationInfo.totalMedDur = 0;
                  return res.json({'success': true, 'data': data, 'info': meditationInfo});
                }
              }
            });
            
            
          } else {
            // Unable to find data
            return res.json({'success': false, 'errMsg': 'There was an error with data retrieval, contact admin'});
          }
        } else {
          return res.json({'success': false, 'errMsg': 'There was an error locating your account'});
        }
      });
    } else {
      res.redirect('/');
    }
  }
  // ACCOUNT UPDATE
  exports.postDashboardRouteAccountUpdate = (req, res) => {
    if(req.isAuthenticated()) {
      // Expected, continue
      // Sanitize
      // Take posted values and pass them into an array and check array contents for expected values
      let postedArr = [];
      let postedArrExpected = ['img', 'name', 'email', 'age', 'addr1', 'addr2', 'city', 'state', 'zip'];
        // Step 1: Populate postedArr with values from req.body
        for(var key in req.body) {
          if(req.body.hasOwnProperty(key)){
            postedArr.push(key);
          }
        }

        // Step 2: Check postedArr against passed in expectedArr
        let postArrCheck = postedArr.every((element) => {
          return postedArrExpected.includes(element);
        });

        // Step 3: Check if all values are obtained that are expected
        if(postArrCheck) {
          req.check('img', '').trim().escape();
          req.check('name', '').trim().escape();
          req.check('email', '').trim().escape();
          req.check('age', '').trim().escape();
          req.check('addr1', '').trim().escape();
          req.check('addr2', '').trim().escape();
          req.check('city', '').trim().escape();
          req.check('state', '').trim().escape();
          req.check('zip', '').trim().escape();

          console.log(req.body);
          console.log(req.file);
          // CHECK DATA SECTION
          if(req.body.name.length > 0) {
            req.check('name', 'Name must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('name', 'Name must be 1 - 40 characters long').isLength({min: 1, max: 60});
          }
          
          if(req.body.email.length > 0) {
            req.check('email', 'Email must be in a valid email format name@domain.com').isEmail();
            req.check('email', 'Email must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('email', 'Email must be fewer than 60 characters in length').isLength({min: 1, max: 60});
          }
          
          if(req.body.age.length > 0) {
            // 0 is default inserted by form, skip if exists
            if(!req.body.age === 0) {
              req.check('age', 'Age must be a number').isNumeric();
              req.check('age', 'Age must be between 1 and 120').isInt({gt: 0, lt: 121});
              req.check('age', 'Age must contain only numbers').matches(/^[0-9]+$/i);
            } 
            
          }
          
          if(req.body.addr1.length > 0) {
            req.check('addr1', 'Address1 must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('addr1', 'Address1 must be 1 - 40 characters long').isLength({min: 1, max: 60});
          }
          
          if(req.body.addr2.length > 0) {
            req.check('addr2', 'Address2 must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('addr2', 'Address2 must be 1 - 40 characters long').isLength({min: 1, max: 60});
          }

          if(req.body.city.length > 0) {
            req.check('city', 'City must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('city', 'City must be 1 - 40 characters long').isLength({min: 1, max: 60});
          }
          

          if(req.body.state.length > 0) {
            req.check('state', 'State must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('state', 'State must be 1 - 40 characters long').isLength({min: 1, max: 60});
          }
          
          if(req.body.state.length > 0) {
            req.check('zip', 'State must contain the characters A-Z, 0-9 or @-`.').matches(/^[A-Za-z0-9@-` .']+$/i);
            req.check('zip', 'State must be 1 - 40 characters long').isLength({min: 1, max: 20});
          }
          
          // Generate errors from checks
          let errors = req.validationErrors();

          // If error exist in submitted data, return errors, do not update account
          if(errors) {
            // Errors exist, return errors to front end
            return res.json({'success': false, 'warningMsgs': errors});
          } else {
            // No errors exist, continue processing
            // Get current account information first, then use those values to determine if they need to be updated
            let username = (String(req.session.passport.user)).toLowerCase();
            AccountCreation.findOne({'username': username}, (err, data) => {
              if(err) {
                return res.json({'success': false, 'errMsg': 'There was an error in the system'});
              } else if(data) {
                if(typeof data == 'object') {
                  if(Object.keys(data).length > 0) {
                    // Data found, now create variables using account values
                    // Only need to change values that are not empty, null or undefined coming from the form post

                    AccountCreation.updateOne({'username': username}, {
                      name: req.body.name,
                      email: req.body.email,
                      age: req.body.age,
                      address1: req.body.addr1,
                      address2: req.body.addr2,
                      city: req.body.city,
                      state: req.body.state,
                      zip: req.body.zip
                    }, (err, updatedInfo) => {
                      if(err) {
                        //console.log(err);
                      } else if(updatedInfo) {
                        if(Object.keys(updatedInfo).length > 0) {
                          // Data updated, return success
                          return res.json({'success': true, 'successMsg': 'Successfully updated'});
                        } else {
                          return res.json({'success': false, 'errMsg': 'There was an error with data updates'});
                        }
                      } else {
                        return res.json({'success': false, 'errMsg': 'There was an error with data updates'});
                      }
                    });
                    
                  }
                } else {
                  // Unable to find data
                  return res.json({'success': false, 'errMsg': 'There was an error with data retrieval'});
                }
              
              
            } else {
              return res.json({'success': false, 'errMsg': 'There was an error locating your account'});
            }
          });
          }
          

          
        } else {
          // Data is missing or added to the javascript post, do not continue
          return res.json({'success': false, 'errMsg': 'There was an error in your post, unprocessed'});
        }
      
      
    } else {
      res.redirect('/');
    }
  }
  exports.postDashboardRouteAccountUpdateImg = (req, res) => {
    if(req.isAuthenticated()) {
      let username = req.session.passport.user;
      let formSize = req.socket.bytesRead;
      // Check if submitted form is too large and throw response
      if (formSize > 12995117) { // About 12Mb
        // Do something to stop the result
        try { throw new Error("Stopping file upload..."); } 
        catch (e) { 
          //res.end(e.toString()); 
          return res.json({'success': false, 'errMsg': 'There was an error with data size'});
        }
        
     } else {
       // Process request
      let form = new formidable.IncomingForm();
      form.parse(req, function(err, fields, files) {
        let type = files.file.type;
        let size = files.file.size;

        if(err) {
          return res.json({'success': false, 'errMsg': 'There was an error with the file upload'});
        } else if(typeof size == 'number') {
          if(size < 10995117) {
            // Size is valid, continue with upload
            if(type == 'image/png' || type == 'image/jpeg' || type == 'image/gif') {
              // Path of original upload
              let oldpath = files.file.path;
              let pathFileName = oldpath.replace('/tmp/upload_', '');
              let ext = '.jpeg';
              if(type == 'image/png') {ext = '.png'} else if(type =='image/jpeg') {ext = '.jpeg'} else if(type == 'image/gif') {ext = '.gif'} else {}
              let newpath = `/tmp/${pathFileName}${ext}`;
              
              // Image type is jpeg or png proceed
              fs.rename(oldpath, newpath, function(err) {
                if(err) {
                  console.log(err);
                } else {
                  // No errors proceed
                  let newpathResized = newpath.replace(`${ext}`, `_resized${ext}`);
                  let inputFile = newpath;
                  let outputFile = newpathResized;
                  sharp(inputFile).resize({height: 300, width: 400}).toFile(outputFile)
                    .then(function(newFileInfo) {
                      // newFileInfo holds the output file properties
                      // Run cleanup by deleting old unused files
                      fs.unlink(`/tmp/${pathFileName}${ext}`, function(err) {
                        if(err) {
                          console.log(err);
                          return res.json({'success': false, 'errMsg': 'There was a server error'});
                        } else {
                          // Continue with upload to Cloudinary
                          // Eager Transformations:
                          // Applied as soon as the file is uploaded, instead of lazily applying them when accessed by your site's visitors.
                          let eager_options = {width: 300, height: 300, crop: 'scale', format: 'jpg'};

                          cloudinary.uploader.upload(outputFile, { tags: "profile", public_id: `profileimage_${username}`, eager: eager_options, folder: 'profileImgs'}, function (err, image) {
                            // "eager" parameter accepts a hash (or just a single item). You can pass
                            if (err) {
                              return res.json({'success': false, 'errMsg': 'There was a problem with cloud connections'});
                            } else {
                              // Proceed to add URL to profile in the database to build image upon visiting profile page
                              // Delete server version of uploaded image
                              fs.unlink(`${outputFile}`, function(err) {
                                if(err) {
                                  console.log(err);
                                  return res.json({'success': false, 'errMsg': 'There was a server error'});
                                } else {
                                  // Image removed, add entry of URL into users profile
                                  let imageURL = image.secure_url;
                                  AccountCreation.updateOne({username: username}, {image: imageURL}, function(err, data) {
                                    if(err) {
                                      // console.log(err);
                                      return res.json({'success': false, 'errMsg': 'Server error: database entry not created'});
                                    } else if(data) {
                                      if(typeof data == 'object') {
                                        if(Object.keys(data).length > 0) {
                                          // No errors, database info updated
                                          return res.json({'success': true});
                                        } else {return res.json({'success': false, 'errMsg': 'Server error: objectKeys less than 0'});}
                                      } else {return res.json({'success': false, 'errMsg': 'Server error: not of type object'});}
                                      
                                    } else {}
                                  });
                                }
                              });
                              
                            }
                          });
                        }
                        
                      });
                      
                    })
                    .catch(function(err) {
                      // Throw error to front end
                      console.log(err);
                      return res.json({'success': false, 'errMsg': 'There was an error with data updates'});
                    });
                    
                }
                
              });
            }
          } else {

          }
        } else {
          return res.json({'success': false, 'errMsg': 'There was an error'});
        }
        
      });
     }

    }
  }


  // LOGOUT POSTS
  exports.postDashboardRouteLogout = (req, res) => {
    if(req.isAuthenticated()) {
        req.session.destroy(function (err) {
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  }