'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Opportunity = mongoose.model('Opportunity'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  opportunity;

/**
 * Opportunity routes tests
 */
describe('Opportunity CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      usernameOrEmail: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.usernameOrEmail,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new opportunity
    user.save(function () {
      opportunity = {
        title: 'Opportunity Title',
        content: 'Opportunity Content'
      };

      done();
    });
  });

  it('should not be able to save an opportunity if logged in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(403)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Call the assertion callback
            done(opportunitySaveErr);
          });

      });
  });

  it('should not be able to save an opportunity if not logged in', function (done) {
    agent.post('/api/opportunities')
      .send(opportunity)
      .expect(403)
      .end(function (opportunitySaveErr, opportunitySaveRes) {
        // Call the assertion callback
        done(opportunitySaveErr);
      });
  });

  it('should not be able to update an opportunity if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(403)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Call the assertion callback
            done(opportunitySaveErr);
          });
      });
  });

  it('should be able to get a list of opportunities if not signed in', function (done) {
    // Create new opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the opportunity
    opportunityObj.save(function () {
      // Request opportunities
      request(app).get('/api/opportunities')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single opportunity if not signed in', function (done) {
    // Create new opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the opportunity
    opportunityObj.save(function () {
      request(app).get('/api/opportunities/' + opportunityObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', opportunity.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single opportunity with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/opportunities/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Opportunity is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single opportunity which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent opportunity
    request(app).get('/api/opportunities/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No opportunity with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should not be able to delete an opportunity if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(403)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Call the assertion callback
            done(opportunitySaveErr);
          });
      });
  });

  it('should not be able to delete an opportunity if not signed in', function (done) {
    // Set opportunity user
    opportunity.user = user;

    // Create new opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the opportunity
    opportunityObj.save(function () {
      // Try deleting opportunity
      request(app).delete('/api/opportunities/' + opportunityObj._id)
        .expect(403)
        .end(function (opportunityDeleteErr, opportunityDeleteRes) {
          // Set message assertion
          (opportunityDeleteRes.body.message).should.match('User is not authorized');

          // Handle opportunity error error
          done(opportunityDeleteErr);
        });

    });
  });

  it('should be able to get a single opportunity that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      usernameOrEmail: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.usernameOrEmail,
      password: _creds.password,
      provider: 'local',
      roles: ['admin']
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

          // Save a new opportunity
          agent.post('/api/opportunities')
            .send(opportunity)
            .expect(200)
            .end(function (opportunitySaveErr, opportunitySaveRes) {
              // Handle opportunity save error
              if (opportunitySaveErr) {
                return done(opportunitySaveErr);
              }

              // Set assertions on new opportunity
              (opportunitySaveRes.body.title).should.equal(opportunity.title);
              should.exist(opportunitySaveRes.body.user);
              should.equal(opportunitySaveRes.body.user._id, orphanId);

              // force the opportunity to have an orphaned user reference
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

                    // Get the opportunity
                    agent.get('/api/opportunities/' + opportunitySaveRes.body._id)
                      .expect(200)
                      .end(function (opportunityInfoErr, opportunityInfoRes) {
                        // Handle opportunity error
                        if (opportunityInfoErr) {
                          return done(opportunityInfoErr);
                        }

                        // Set assertions
                        (opportunityInfoRes.body._id).should.equal(opportunitySaveRes.body._id);
                        (opportunityInfoRes.body.title).should.equal(opportunity.title);
                        should.equal(opportunityInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single opportunity if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the opportunity
    opportunityObj.save(function () {
      request(app).get('/api/opportunities/' + opportunityObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', opportunity.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single opportunity, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      usernameOrEmail: 'opportunityowner',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create user that will create the Opportunity
    var _opportunityOwner = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.usernameOrEmail,
      password: _creds.password,
      provider: 'local',
      roles: ['admin', 'user']
    });

    _opportunityOwner.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Opportunity
      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var userId = _user._id;

          // Save a new opportunity
          agent.post('/api/opportunities')
            .send(opportunity)
            .expect(200)
            .end(function (opportunitySaveErr, opportunitySaveRes) {
              // Handle opportunity save error
              if (opportunitySaveErr) {
                return done(opportunitySaveErr);
              }

              // Set assertions on new opportunity
              (opportunitySaveRes.body.title).should.equal(opportunity.title);
              should.exist(opportunitySaveRes.body.user);
              should.equal(opportunitySaveRes.body.user._id, userId);

              // now signin with the test suite user
              agent.post('/api/auth/signin')
                .send(credentials)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the opportunity
                  agent.get('/api/opportunities/' + opportunitySaveRes.body._id)
                    .expect(200)
                    .end(function (opportunityInfoErr, opportunityInfoRes) {
                      // Handle opportunity error
                      if (opportunityInfoErr) {
                        return done(opportunityInfoErr);
                      }

                      // Set assertions
                      (opportunityInfoRes.body._id).should.equal(opportunitySaveRes.body._id);
                      (opportunityInfoRes.body.title).should.equal(opportunity.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (opportunityInfoRes.body.isCurrentUserOwner).should.equal(false);

                      // Call the assertion callback
                      done();
                    });
                });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Opportunity.remove().exec(done);
    });
  });
});
