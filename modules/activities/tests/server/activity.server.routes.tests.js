'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Activity = mongoose.model('Activity'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  activity;

/**
 * Activity routes tests
 */
describe('Activity CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Activity
    user.save(function () {
      activity = {
        name: 'Activity name'
      };

      done();
    });
  });

  it('should be able to save a Activity if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Activity
        agent.post('/api/activities')
          .send(activity)
          .expect(200)
          .end(function (activitySaveErr, activitySaveRes) {
            // Handle Activity save error
            if (activitySaveErr) {
              return done(activitySaveErr);
            }

            // Get a list of Activities
            agent.get('/api/activities')
              .end(function (activitiesGetErr, activitiesGetRes) {
                // Handle Activities save error
                if (activitiesGetErr) {
                  return done(activitiesGetErr);
                }

                // Get Activities list
                var activities = activitiesGetRes.body;

                // Set assertions
                (activities[0].user._id).should.equal(userId);
                (activities[0].name).should.match('Activity name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Activity if not logged in', function (done) {
    agent.post('/api/activities')
      .send(activity)
      .expect(403)
      .end(function (activitySaveErr, activitySaveRes) {
        // Call the assertion callback
        done(activitySaveErr);
      });
  });

  it('should not be able to save an Activity if no name is provided', function (done) {
    // Invalidate name field
    activity.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Activity
        agent.post('/api/activities')
          .send(activity)
          .expect(400)
          .end(function (activitySaveErr, activitySaveRes) {
            // Set message assertion
            (activitySaveRes.body.message).should.match('Please fill Activity name');

            // Handle Activity save error
            done(activitySaveErr);
          });
      });
  });

  it('should be able to update an Activity if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Activity
        agent.post('/api/activities')
          .send(activity)
          .expect(200)
          .end(function (activitySaveErr, activitySaveRes) {
            // Handle Activity save error
            if (activitySaveErr) {
              return done(activitySaveErr);
            }

            // Update Activity name
            activity.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Activity
            agent.put('/api/activities/' + activitySaveRes.body._id)
              .send(activity)
              .expect(200)
              .end(function (activityUpdateErr, activityUpdateRes) {
                // Handle Activity update error
                if (activityUpdateErr) {
                  return done(activityUpdateErr);
                }

                // Set assertions
                (activityUpdateRes.body._id).should.equal(activitySaveRes.body._id);
                (activityUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Activities if not signed in', function (done) {
    // Create new Activity model instance
    var activityObj = new Activity(activity);

    // Save the activity
    activityObj.save(function () {
      // Request Activities
      request(app).get('/api/activities')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Activity if not signed in', function (done) {
    // Create new Activity model instance
    var activityObj = new Activity(activity);

    // Save the Activity
    activityObj.save(function () {
      request(app).get('/api/activities/' + activityObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', activity.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Activity with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/activities/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Activity is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Activity which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Activity
    request(app).get('/api/activities/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Activity with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Activity if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Activity
        agent.post('/api/activities')
          .send(activity)
          .expect(200)
          .end(function (activitySaveErr, activitySaveRes) {
            // Handle Activity save error
            if (activitySaveErr) {
              return done(activitySaveErr);
            }

            // Delete an existing Activity
            agent.delete('/api/activities/' + activitySaveRes.body._id)
              .send(activity)
              .expect(200)
              .end(function (activityDeleteErr, activityDeleteRes) {
                // Handle activity error error
                if (activityDeleteErr) {
                  return done(activityDeleteErr);
                }

                // Set assertions
                (activityDeleteRes.body._id).should.equal(activitySaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Activity if not signed in', function (done) {
    // Set Activity user
    activity.user = user;

    // Create new Activity model instance
    var activityObj = new Activity(activity);

    // Save the Activity
    activityObj.save(function () {
      // Try deleting Activity
      request(app).delete('/api/activities/' + activityObj._id)
        .expect(403)
        .end(function (activityDeleteErr, activityDeleteRes) {
          // Set message assertion
          (activityDeleteRes.body.message).should.match('User is not authorized');

          // Handle Activity error error
          done(activityDeleteErr);
        });

    });
  });

  it('should be able to get a single Activity that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Activity
          agent.post('/api/activities')
            .send(activity)
            .expect(200)
            .end(function (activitySaveErr, activitySaveRes) {
              // Handle Activity save error
              if (activitySaveErr) {
                return done(activitySaveErr);
              }

              // Set assertions on new Activity
              (activitySaveRes.body.name).should.equal(activity.name);
              should.exist(activitySaveRes.body.user);
              should.equal(activitySaveRes.body.user._id, orphanId);

              // force the Activity to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Activity
                    agent.get('/api/activities/' + activitySaveRes.body._id)
                      .expect(200)
                      .end(function (activityInfoErr, activityInfoRes) {
                        // Handle Activity error
                        if (activityInfoErr) {
                          return done(activityInfoErr);
                        }

                        // Set assertions
                        (activityInfoRes.body._id).should.equal(activitySaveRes.body._id);
                        (activityInfoRes.body.name).should.equal(activity.name);
                        should.equal(activityInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Activity.remove().exec(done);
    });
  });
});
