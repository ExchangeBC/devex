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
describe('Team Admin CRUD tests', function () {
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

    // Save a user to the test db and create new team
    user.save(function () {
      team = {
        title: 'Team Title',
        content: 'Team Content'
      };

      done();
    });
  });

  it('should be able to save an team if logged in', function (done) {
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

        // Save a new team
        agent.post('/api/teams')
          .send(team)
          .expect(200)
          .end(function (teamSaveErr, teamSaveRes) {
            // Handle team save error
            if (teamSaveErr) {
              return done(teamSaveErr);
            }

            // Get a list of teams
            agent.get('/api/teams')
              .end(function (teamsGetErr, teamsGetRes) {
                // Handle team save error
                if (teamsGetErr) {
                  return done(teamsGetErr);
                }

                // Get teams list
                var teams = teamsGetRes.body;

                // Set assertions
                (teams[0].user._id).should.equal(userId);
                (teams[0].title).should.match('Team Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to update an team if signed in', function (done) {
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

        // Save a new team
        agent.post('/api/teams')
          .send(team)
          .expect(200)
          .end(function (teamSaveErr, teamSaveRes) {
            // Handle team save error
            if (teamSaveErr) {
              return done(teamSaveErr);
            }

            // Update team title
            team.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing team
            agent.put('/api/teams/' + teamSaveRes.body._id)
              .send(team)
              .expect(200)
              .end(function (teamUpdateErr, teamUpdateRes) {
                // Handle team update error
                if (teamUpdateErr) {
                  return done(teamUpdateErr);
                }

                // Set assertions
                (teamUpdateRes.body._id).should.equal(teamSaveRes.body._id);
                (teamUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an team if no title is provided', function (done) {
    // Invalidate title field
    team.title = '';

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

        // Save a new team
        agent.post('/api/teams')
          .send(team)
          .expect(422)
          .end(function (teamSaveErr, teamSaveRes) {
            // Set message assertion
            (teamSaveRes.body.message).should.match('Title cannot be blank');

            // Handle team save error
            done(teamSaveErr);
          });
      });
  });

  it('should be able to delete an team if signed in', function (done) {
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

        // Save a new team
        agent.post('/api/teams')
          .send(team)
          .expect(200)
          .end(function (teamSaveErr, teamSaveRes) {
            // Handle team save error
            if (teamSaveErr) {
              return done(teamSaveErr);
            }

            // Delete an existing team
            agent.delete('/api/teams/' + teamSaveRes.body._id)
              .send(team)
              .expect(200)
              .end(function (teamDeleteErr, teamDeleteRes) {
                // Handle team error error
                if (teamDeleteErr) {
                  return done(teamDeleteErr);
                }

                // Set assertions
                (teamDeleteRes.body._id).should.equal(teamSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a single team if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new team model instance
    team.user = user;
    var teamObj = new Team(team);

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

        // Save a new team
        agent.post('/api/teams')
          .send(team)
          .expect(200)
          .end(function (teamSaveErr, teamSaveRes) {
            // Handle team save error
            if (teamSaveErr) {
              return done(teamSaveErr);
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

                // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                (teamInfoRes.body.isCurrentUserOwner).should.equal(true);

                // Call the assertion callback
                done();
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
