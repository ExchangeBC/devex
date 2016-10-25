'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Program = mongoose.model('Program'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  program;

/**
 * Program routes tests
 */
describe('Program Admin CRUD tests', function () {
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

    // Save a user to the test db and create new program
    user.save(function () {
      program = {
        title: 'Program Title',
        content: 'Program Content'
      };

      done();
    });
  });

  it('should be able to save an program if logged in', function (done) {
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

        // Save a new program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Get a list of programs
            agent.get('/api/programs')
              .end(function (programsGetErr, programsGetRes) {
                // Handle program save error
                if (programsGetErr) {
                  return done(programsGetErr);
                }

                // Get programs list
                var programs = programsGetRes.body;

                // Set assertions
                (programs[0].user._id).should.equal(userId);
                (programs[0].title).should.match('Program Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to update an program if signed in', function (done) {
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

        // Save a new program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Update program title
            program.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing program
            agent.put('/api/programs/' + programSaveRes.body._id)
              .send(program)
              .expect(200)
              .end(function (programUpdateErr, programUpdateRes) {
                // Handle program update error
                if (programUpdateErr) {
                  return done(programUpdateErr);
                }

                // Set assertions
                (programUpdateRes.body._id).should.equal(programSaveRes.body._id);
                (programUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an program if no title is provided', function (done) {
    // Invalidate title field
    program.title = '';

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

        // Save a new program
        agent.post('/api/programs')
          .send(program)
          .expect(422)
          .end(function (programSaveErr, programSaveRes) {
            // Set message assertion
            (programSaveRes.body.message).should.match('Title cannot be blank');

            // Handle program save error
            done(programSaveErr);
          });
      });
  });

  it('should be able to delete an program if signed in', function (done) {
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

        // Save a new program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Delete an existing program
            agent.delete('/api/programs/' + programSaveRes.body._id)
              .send(program)
              .expect(200)
              .end(function (programDeleteErr, programDeleteRes) {
                // Handle program error error
                if (programDeleteErr) {
                  return done(programDeleteErr);
                }

                // Set assertions
                (programDeleteRes.body._id).should.equal(programSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a single program if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new program model instance
    program.user = user;
    var programObj = new Program(program);

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

        // Save a new program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Get the program
            agent.get('/api/programs/' + programSaveRes.body._id)
              .expect(200)
              .end(function (programInfoErr, programInfoRes) {
                // Handle program error
                if (programInfoErr) {
                  return done(programInfoErr);
                }

                // Set assertions
                (programInfoRes.body._id).should.equal(programSaveRes.body._id);
                (programInfoRes.body.title).should.equal(program.title);

                // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                (programInfoRes.body.isCurrentUserOwner).should.equal(true);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Program.remove().exec(done);
    });
  });
});
