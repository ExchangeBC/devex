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
describe('Opportunity Admin CRUD tests', function () {
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
      roles: ['user', 'admin'],
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

  it('should be able to save an opportunity if logged in', function (done) {
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

        // Save a new opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Get a list of opportunities
            agent.get('/api/opportunities')
              .end(function (opportunitiesGetErr, opportunitiesGetRes) {
                // Handle opportunity save error
                if (opportunitiesGetErr) {
                  return done(opportunitiesGetErr);
                }

                // Get opportunities list
                var opportunities = opportunitiesGetRes.body;

                // Set assertions
                (opportunities[0].user._id).should.equal(userId);
                (opportunities[0].title).should.match('Opportunity Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to update an opportunity if signed in', function (done) {
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

        // Save a new opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Update opportunity title
            opportunity.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing opportunity
            agent.put('/api/opportunities/' + opportunitySaveRes.body._id)
              .send(opportunity)
              .expect(200)
              .end(function (opportunityUpdateErr, opportunityUpdateRes) {
                // Handle opportunity update error
                if (opportunityUpdateErr) {
                  return done(opportunityUpdateErr);
                }

                // Set assertions
                (opportunityUpdateRes.body._id).should.equal(opportunitySaveRes.body._id);
                (opportunityUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an opportunity if no title is provided', function (done) {
    // Invalidate title field
    opportunity.title = '';

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

        // Save a new opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(422)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Set message assertion
            (opportunitySaveRes.body.message).should.match('Title cannot be blank');

            // Handle opportunity save error
            done(opportunitySaveErr);
          });
      });
  });

  it('should be able to delete an opportunity if signed in', function (done) {
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

        // Save a new opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
            }

            // Delete an existing opportunity
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

  it('should be able to get a single opportunity if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new opportunity model instance
    opportunity.user = user;
    var opportunityObj = new Opportunity(opportunity);

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

        // Save a new opportunity
        agent.post('/api/opportunities')
          .send(opportunity)
          .expect(200)
          .end(function (opportunitySaveErr, opportunitySaveRes) {
            // Handle opportunity save error
            if (opportunitySaveErr) {
              return done(opportunitySaveErr);
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

                // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                (opportunityInfoRes.body.isCurrentUserOwner).should.equal(true);

                // Call the assertion callback
                done();
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
