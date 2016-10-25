'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Team = mongoose.model('Team'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  team;

/**
 * Team routes tests
 */
describe('Team CRUD tests', function () {

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

    // Save a user to the test db and create new team
    user.save(function () {
      team = {
        title: 'Team Title',
        content: 'Team Content'
      };

      done();
    });
  });

  it('should not be able to save an team if logged in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/teams')
          .send(team)
          .expect(403)
          .end(function (teamSaveErr, teamSaveRes) {
            // Call the assertion callback
            done(teamSaveErr);
          });

      });
  });

  it('should not be able to save an team if not logged in', function (done) {
    agent.post('/api/teams')
      .send(team)
      .expect(403)
      .end(function (teamSaveErr, teamSaveRes) {
        // Call the assertion callback
        done(teamSaveErr);
      });
  });

  it('should not be able to update an team if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/teams')
          .send(team)
          .expect(403)
          .end(function (teamSaveErr, teamSaveRes) {
            // Call the assertion callback
            done(teamSaveErr);
          });
      });
  });

  it('should be able to get a list of teams if not signed in', function (done) {
    // Create new team model instance
    var teamObj = new Team(team);

    // Save the team
    teamObj.save(function () {
      // Request teams
      request(app).get('/api/teams')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single team if not signed in', function (done) {
    // Create new team model instance
    var teamObj = new Team(team);

    // Save the team
    teamObj.save(function () {
      request(app).get('/api/teams/' + teamObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', team.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single team with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/teams/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Team is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single team which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent team
    request(app).get('/api/teams/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No team with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should not be able to delete an team if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/teams')
          .send(team)
          .expect(403)
          .end(function (teamSaveErr, teamSaveRes) {
            // Call the assertion callback
            done(teamSaveErr);
          });
      });
  });

  it('should not be able to delete an team if not signed in', function (done) {
    // Set team user
    team.user = user;

    // Create new team model instance
    var teamObj = new Team(team);

    // Save the team
    teamObj.save(function () {
      // Try deleting team
      request(app).delete('/api/teams/' + teamObj._id)
        .expect(403)
        .end(function (teamDeleteErr, teamDeleteRes) {
          // Set message assertion
          (teamDeleteRes.body.message).should.match('User is not authorized');

          // Handle team error error
          done(teamDeleteErr);
        });

    });
  });

  it('should be able to get a single team that has an orphaned user reference', function (done) {
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

          // Save a new team
          agent.post('/api/teams')
            .send(team)
            .expect(200)
            .end(function (teamSaveErr, teamSaveRes) {
              // Handle team save error
              if (teamSaveErr) {
                return done(teamSaveErr);
              }

              // Set assertions on new team
              (teamSaveRes.body.title).should.equal(team.title);
              should.exist(teamSaveRes.body.user);
              should.equal(teamSaveRes.body.user._id, orphanId);

              // force the team to have an orphaned user reference
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

                    // Get the team
                    agent.get('/api/teams/' + teamSaveRes.body._id)
                      .expect(200)
                      .end(function (teamInfoErr, teamInfoRes) {
                        // Handle team error
                        if (teamInfoErr) {
                          return done(teamInfoErr);
                        }

                        // Set assertions
                        (teamInfoRes.body._id).should.equal(teamSaveRes.body._id);
                        (teamInfoRes.body.title).should.equal(team.title);
                        should.equal(teamInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single team if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new team model instance
    var teamObj = new Team(team);

    // Save the team
    teamObj.save(function () {
      request(app).get('/api/teams/' + teamObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', team.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single team, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      usernameOrEmail: 'teamowner',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create user that will create the Team
    var _teamOwner = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.usernameOrEmail,
      password: _creds.password,
      provider: 'local',
      roles: ['admin', 'user']
    });

    _teamOwner.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Team
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

          // Save a new team
          agent.post('/api/teams')
            .send(team)
            .expect(200)
            .end(function (teamSaveErr, teamSaveRes) {
              // Handle team save error
              if (teamSaveErr) {
                return done(teamSaveErr);
              }

              // Set assertions on new team
              (teamSaveRes.body.title).should.equal(team.title);
              should.exist(teamSaveRes.body.user);
              should.equal(teamSaveRes.body.user._id, userId);

              // now signin with the test suite user
              agent.post('/api/auth/signin')
                .send(credentials)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the team
                  agent.get('/api/teams/' + teamSaveRes.body._id)
                    .expect(200)
                    .end(function (teamInfoErr, teamInfoRes) {
                      // Handle team error
                      if (teamInfoErr) {
                        return done(teamInfoErr);
                      }

                      // Set assertions
                      (teamInfoRes.body._id).should.equal(teamSaveRes.body._id);
                      (teamInfoRes.body.title).should.equal(team.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (teamInfoRes.body.isCurrentUserOwner).should.equal(false);

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
      Team.remove().exec(done);
    });
  });
});
