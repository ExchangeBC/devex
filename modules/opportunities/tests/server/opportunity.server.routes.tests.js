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

    // Save a user to the test db and create new Opportunity
    user.save(function () {
      opportunity = {
        name: 'Opportunity name'
      };

      done();
    });
  });

  it('should be able to save a Opportunity if logged in', function (done) {
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

        // Save a new Opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle Opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Get a list of Opportunities
            agent.get('/api/opportunities')
              .end(function (opportunitiesGetErr, opportunitiesGetRes) {
                // Handle Opportunities save error
                if (opportunitiesGetErr) {
                  return done(opportunitiesGetErr);
                }

                // Get Opportunities list
                var opportunities = opportunitiesGetRes.body;

                // Set assertions
                (opportunities[0].user._id).should.equal(userId);
                (opportunities[0].name).should.match('Opportunity name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Opportunity if not logged in', function (done) {
    agent.post('/api/opportunities')
      .send(opportunity)
      .expect(403)
      .end(function (opportunitySaveErr, opportunitySaveRes) {
        // Call the assertion callback
        done(opportunitySaveErr);
      });
  });

  it('should not be able to save an Opportunity if no name is provided', function (done) {
    // Invalidate name field
    opportunity.name = '';

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

        // Save a new Opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(400)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Set message assertion
            (opportunitySaveRes.body.message).should.match('Please fill Opportunity name');

            // Handle Opportunity save error
            done(opportunitySaveErr);
          });
      });
  });

  it('should be able to update an Opportunity if signed in', function (done) {
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

        // Save a new Opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle Opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Update Opportunity name
            opportunity.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Opportunity
            agent.put('/api/opportunities/' + opportunitySaveRes.body._id)
              .send(opportunity)
              .expect(200)
              .end(function (opportunityUpdateErr, opportunityUpdateRes) {
                // Handle Opportunity update error
                if (opportunityUpdateErr) {
                  return done(opportunityUpdateErr);
                }

                // Set assertions
                (opportunityUpdateRes.body._id).should.equal(opportunitySaveRes.body._id);
                (opportunityUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Opportunities if not signed in', function (done) {
    // Create new Opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the opportunity
    opportunityObj.save(function () {
      // Request Opportunities
      request(app).get('/api/opportunities')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Opportunity if not signed in', function (done) {
    // Create new Opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the Opportunity
    opportunityObj.save(function () {
      request(app).get('/api/opportunities/' + opportunityObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', opportunity.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Opportunity with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/opportunities/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Opportunity is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Opportunity which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Opportunity
    request(app).get('/api/opportunities/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Opportunity with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Opportunity if signed in', function (done) {
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

        // Save a new Opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle Opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Delete an existing Opportunity
            agent.delete('/api/opportunities/' + opportunitySaveRes.body._id)
              .send(opportunity)
              .expect(200)
              .end(function (opportunityDeleteErr, opportunityDeleteRes) {
                // Handle opportunity error error
                if (opportunityDeleteErr) {
                  return done(opportunityDeleteErr);
                }

                // Set assertions
                (opportunityDeleteRes.body._id).should.equal(opportunitySaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Opportunity if not signed in', function (done) {
    // Set Opportunity user
    opportunity.user = user;

    // Create new Opportunity model instance
    var opportunityObj = new Opportunity(opportunity);

    // Save the Opportunity
    opportunityObj.save(function () {
      // Try deleting Opportunity
      request(app).delete('/api/opportunities/' + opportunityObj._id)
        .expect(403)
        .end(function (opportunityDeleteErr, opportunityDeleteRes) {
          // Set message assertion
          (opportunityDeleteRes.body.message).should.match('User is not authorized');

          // Handle Opportunity error error
          done(opportunityDeleteErr);
        });

    });
  });

  it('should be able to get a single Opportunity that has an orphaned user reference', function (done) {
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

          // Save a new Opportunity
          agent.post('/api/opportunities')
            .send(opportunity)
            .expect(200)
            .end(function (opportunitySaveErr, opportunitySaveRes) {
              // Handle Opportunity save error
              if (opportunitySaveErr) {
                return done(opportunitySaveErr);
              }

              // Set assertions on new Opportunity
              (opportunitySaveRes.body.name).should.equal(opportunity.name);
              should.exist(opportunitySaveRes.body.user);
              should.equal(opportunitySaveRes.body.user._id, orphanId);

              // force the Opportunity to have an orphaned user reference
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

                    // Get the Opportunity
                    agent.get('/api/opportunities/' + opportunitySaveRes.body._id)
                      .expect(200)
                      .end(function (opportunityInfoErr, opportunityInfoRes) {
                        // Handle Opportunity error
                        if (opportunityInfoErr) {
                          return done(opportunityInfoErr);
                        }

                        // Set assertions
                        (opportunityInfoRes.body._id).should.equal(opportunitySaveRes.body._id);
                        (opportunityInfoRes.body.name).should.equal(opportunity.name);
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

  afterEach(function (done) {
    User.remove().exec(function () {
      Opportunity.remove().exec(done);
    });
  });
});
