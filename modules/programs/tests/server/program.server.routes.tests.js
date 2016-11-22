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
describe('Program CRUD tests', function () {

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

    // Save a user to the test db and create new Program
    user.save(function () {
      program = {
        name: 'Program name'
      };

      done();
    });
  });

  it('should be able to save a Program if logged in', function (done) {
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

        // Save a new Program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle Program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Get a list of Programs
            agent.get('/api/programs')
              .end(function (programsGetErr, programsGetRes) {
                // Handle Programs save error
                if (programsGetErr) {
                  return done(programsGetErr);
                }

                // Get Programs list
                var programs = programsGetRes.body;

                // Set assertions
                (programs[0].user._id).should.equal(userId);
                (programs[0].name).should.match('Program name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Program if not logged in', function (done) {
    agent.post('/api/programs')
      .send(program)
      .expect(403)
      .end(function (programSaveErr, programSaveRes) {
        // Call the assertion callback
        done(programSaveErr);
      });
  });

  it('should not be able to save an Program if no name is provided', function (done) {
    // Invalidate name field
    program.name = '';

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

        // Save a new Program
        agent.post('/api/programs')
          .send(program)
          .expect(400)
          .end(function (programSaveErr, programSaveRes) {
            // Set message assertion
            (programSaveRes.body.message).should.match('Please fill Program name');

            // Handle Program save error
            done(programSaveErr);
          });
      });
  });

  it('should be able to update an Program if signed in', function (done) {
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

        // Save a new Program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle Program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Update Program name
            program.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Program
            agent.put('/api/programs/' + programSaveRes.body._id)
              .send(program)
              .expect(200)
              .end(function (programUpdateErr, programUpdateRes) {
                // Handle Program update error
                if (programUpdateErr) {
                  return done(programUpdateErr);
                }

                // Set assertions
                (programUpdateRes.body._id).should.equal(programSaveRes.body._id);
                (programUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Programs if not signed in', function (done) {
    // Create new Program model instance
    var programObj = new Program(program);

    // Save the program
    programObj.save(function () {
      // Request Programs
      request(app).get('/api/programs')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Program if not signed in', function (done) {
    // Create new Program model instance
    var programObj = new Program(program);

    // Save the Program
    programObj.save(function () {
      request(app).get('/api/programs/' + programObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', program.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Program with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/programs/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Program is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Program which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Program
    request(app).get('/api/programs/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Program with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Program if signed in', function (done) {
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

        // Save a new Program
        agent.post('/api/programs')
          .send(program)
          .expect(200)
          .end(function (programSaveErr, programSaveRes) {
            // Handle Program save error
            if (programSaveErr) {
              return done(programSaveErr);
            }

            // Delete an existing Program
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

  it('should not be able to delete an Program if not signed in', function (done) {
    // Set Program user
    program.user = user;

    // Create new Program model instance
    var programObj = new Program(program);

    // Save the Program
    programObj.save(function () {
      // Try deleting Program
      request(app).delete('/api/programs/' + programObj._id)
        .expect(403)
        .end(function (programDeleteErr, programDeleteRes) {
          // Set message assertion
          (programDeleteRes.body.message).should.match('User is not authorized');

          // Handle Program error error
          done(programDeleteErr);
        });

    });
  });

  it('should be able to get a single Program that has an orphaned user reference', function (done) {
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

          // Save a new Program
          agent.post('/api/programs')
            .send(program)
            .expect(200)
            .end(function (programSaveErr, programSaveRes) {
              // Handle Program save error
              if (programSaveErr) {
                return done(programSaveErr);
              }

              // Set assertions on new Program
              (programSaveRes.body.name).should.equal(program.name);
              should.exist(programSaveRes.body.user);
              should.equal(programSaveRes.body.user._id, orphanId);

              // force the Program to have an orphaned user reference
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

                    // Get the Program
                    agent.get('/api/programs/' + programSaveRes.body._id)
                      .expect(200)
                      .end(function (programInfoErr, programInfoRes) {
                        // Handle Program error
                        if (programInfoErr) {
                          return done(programInfoErr);
                        }

                        // Set assertions
                        (programInfoRes.body._id).should.equal(programSaveRes.body._id);
                        (programInfoRes.body.name).should.equal(program.name);
                        should.equal(programInfoRes.body.user, undefined);

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
      Program.remove().exec(done);
    });
  });
});
