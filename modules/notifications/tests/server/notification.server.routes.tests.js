'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Notification = mongoose.model('Notification'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  notification;

/**
 * Notification routes tests
 */
describe('Notification CRUD tests', function () {

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

    // Save a user to the test db and create new Notification
    user.save(function () {
      notification = {
        name: 'Notification name'
      };

      done();
    });
  });

  it('should be able to save a Notification if logged in', function (done) {
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

        // Save a new Notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle Notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Get a list of Notifications
            agent.get('/api/notifications')
              .end(function (notificationsGetErr, notificationsGetRes) {
                // Handle Notifications save error
                if (notificationsGetErr) {
                  return done(notificationsGetErr);
                }

                // Get Notifications list
                var notifications = notificationsGetRes.body;

                // Set assertions
                (notifications[0].user._id).should.equal(userId);
                (notifications[0].name).should.match('Notification name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Notification if not logged in', function (done) {
    agent.post('/api/notifications')
      .send(notification)
      .expect(403)
      .end(function (notificationSaveErr, notificationSaveRes) {
        // Call the assertion callback
        done(notificationSaveErr);
      });
  });

  it('should not be able to save an Notification if no name is provided', function (done) {
    // Invalidate name field
    notification.name = '';

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

        // Save a new Notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(400)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Set message assertion
            (notificationSaveRes.body.message).should.match('Please fill Notification name');

            // Handle Notification save error
            done(notificationSaveErr);
          });
      });
  });

  it('should be able to update an Notification if signed in', function (done) {
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

        // Save a new Notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle Notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Update Notification name
            notification.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Notification
            agent.put('/api/notifications/' + notificationSaveRes.body._id)
              .send(notification)
              .expect(200)
              .end(function (notificationUpdateErr, notificationUpdateRes) {
                // Handle Notification update error
                if (notificationUpdateErr) {
                  return done(notificationUpdateErr);
                }

                // Set assertions
                (notificationUpdateRes.body._id).should.equal(notificationSaveRes.body._id);
                (notificationUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Notifications if not signed in', function (done) {
    // Create new Notification model instance
    var notificationObj = new Notification(notification);

    // Save the notification
    notificationObj.save(function () {
      // Request Notifications
      request(app).get('/api/notifications')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Notification if not signed in', function (done) {
    // Create new Notification model instance
    var notificationObj = new Notification(notification);

    // Save the Notification
    notificationObj.save(function () {
      request(app).get('/api/notifications/' + notificationObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', notification.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Notification with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/notifications/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Notification is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Notification which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Notification
    request(app).get('/api/notifications/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Notification with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Notification if signed in', function (done) {
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

        // Save a new Notification
        agent.post('/api/notifications')
          .send(notification)
          .expect(200)
          .end(function (notificationSaveErr, notificationSaveRes) {
            // Handle Notification save error
            if (notificationSaveErr) {
              return done(notificationSaveErr);
            }

            // Delete an existing Notification
            agent.delete('/api/notifications/' + notificationSaveRes.body._id)
              .send(notification)
              .expect(200)
              .end(function (notificationDeleteErr, notificationDeleteRes) {
                // Handle notification error error
                if (notificationDeleteErr) {
                  return done(notificationDeleteErr);
                }

                // Set assertions
                (notificationDeleteRes.body._id).should.equal(notificationSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Notification if not signed in', function (done) {
    // Set Notification user
    notification.user = user;

    // Create new Notification model instance
    var notificationObj = new Notification(notification);

    // Save the Notification
    notificationObj.save(function () {
      // Try deleting Notification
      request(app).delete('/api/notifications/' + notificationObj._id)
        .expect(403)
        .end(function (notificationDeleteErr, notificationDeleteRes) {
          // Set message assertion
          (notificationDeleteRes.body.message).should.match('User is not authorized');

          // Handle Notification error error
          done(notificationDeleteErr);
        });

    });
  });

  it('should be able to get a single Notification that has an orphaned user reference', function (done) {
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

          // Save a new Notification
          agent.post('/api/notifications')
            .send(notification)
            .expect(200)
            .end(function (notificationSaveErr, notificationSaveRes) {
              // Handle Notification save error
              if (notificationSaveErr) {
                return done(notificationSaveErr);
              }

              // Set assertions on new Notification
              (notificationSaveRes.body.name).should.equal(notification.name);
              should.exist(notificationSaveRes.body.user);
              should.equal(notificationSaveRes.body.user._id, orphanId);

              // force the Notification to have an orphaned user reference
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

                    // Get the Notification
                    agent.get('/api/notifications/' + notificationSaveRes.body._id)
                      .expect(200)
                      .end(function (notificationInfoErr, notificationInfoRes) {
                        // Handle Notification error
                        if (notificationInfoErr) {
                          return done(notificationInfoErr);
                        }

                        // Set assertions
                        (notificationInfoRes.body._id).should.equal(notificationSaveRes.body._id);
                        (notificationInfoRes.body.name).should.equal(notification.name);
                        should.equal(notificationInfoRes.body.user, undefined);

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
      Notification.remove().exec(done);
    });
  });
});
