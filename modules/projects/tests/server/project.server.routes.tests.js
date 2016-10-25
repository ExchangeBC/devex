'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Project = mongoose.model('Project'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  project;

/**
 * Project routes tests
 */
describe('Project CRUD tests', function () {

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

    // Save a user to the test db and create new project
    user.save(function () {
      project = {
        title: 'Project Title',
        content: 'Project Content'
      };

      done();
    });
  });

  it('should not be able to save an project if logged in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/projects')
          .send(project)
          .expect(403)
          .end(function (projectSaveErr, projectSaveRes) {
            // Call the assertion callback
            done(projectSaveErr);
          });

      });
  });

  it('should not be able to save an project if not logged in', function (done) {
    agent.post('/api/projects')
      .send(project)
      .expect(403)
      .end(function (projectSaveErr, projectSaveRes) {
        // Call the assertion callback
        done(projectSaveErr);
      });
  });

  it('should not be able to update an project if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/projects')
          .send(project)
          .expect(403)
          .end(function (projectSaveErr, projectSaveRes) {
            // Call the assertion callback
            done(projectSaveErr);
          });
      });
  });

  it('should be able to get a list of projects if not signed in', function (done) {
    // Create new project model instance
    var projectObj = new Project(project);

    // Save the project
    projectObj.save(function () {
      // Request projects
      request(app).get('/api/projects')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single project if not signed in', function (done) {
    // Create new project model instance
    var projectObj = new Project(project);

    // Save the project
    projectObj.save(function () {
      request(app).get('/api/projects/' + projectObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', project.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single project with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/projects/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Project is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single project which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent project
    request(app).get('/api/projects/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No project with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should not be able to delete an project if signed in without the "admin" role', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.post('/api/projects')
          .send(project)
          .expect(403)
          .end(function (projectSaveErr, projectSaveRes) {
            // Call the assertion callback
            done(projectSaveErr);
          });
      });
  });

  it('should not be able to delete an project if not signed in', function (done) {
    // Set project user
    project.user = user;

    // Create new project model instance
    var projectObj = new Project(project);

    // Save the project
    projectObj.save(function () {
      // Try deleting project
      request(app).delete('/api/projects/' + projectObj._id)
        .expect(403)
        .end(function (projectDeleteErr, projectDeleteRes) {
          // Set message assertion
          (projectDeleteRes.body.message).should.match('User is not authorized');

          // Handle project error error
          done(projectDeleteErr);
        });

    });
  });

  it('should be able to get a single project that has an orphaned user reference', function (done) {
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

          // Save a new project
          agent.post('/api/projects')
            .send(project)
            .expect(200)
            .end(function (projectSaveErr, projectSaveRes) {
              // Handle project save error
              if (projectSaveErr) {
                return done(projectSaveErr);
              }

              // Set assertions on new project
              (projectSaveRes.body.title).should.equal(project.title);
              should.exist(projectSaveRes.body.user);
              should.equal(projectSaveRes.body.user._id, orphanId);

              // force the project to have an orphaned user reference
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

                    // Get the project
                    agent.get('/api/projects/' + projectSaveRes.body._id)
                      .expect(200)
                      .end(function (projectInfoErr, projectInfoRes) {
                        // Handle project error
                        if (projectInfoErr) {
                          return done(projectInfoErr);
                        }

                        // Set assertions
                        (projectInfoRes.body._id).should.equal(projectSaveRes.body._id);
                        (projectInfoRes.body.title).should.equal(project.title);
                        should.equal(projectInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  it('should be able to get a single project if not signed in and verify the custom "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create new project model instance
    var projectObj = new Project(project);

    // Save the project
    projectObj.save(function () {
      request(app).get('/api/projects/' + projectObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', project.title);
          // Assert the custom field "isCurrentUserOwner" is set to false for the un-authenticated User
          res.body.should.be.instanceof(Object).and.have.property('isCurrentUserOwner', false);
          // Call the assertion callback
          done();
        });
    });
  });

  it('should be able to get single project, that a different user created, if logged in & verify the "isCurrentUserOwner" field is set to "false"', function (done) {
    // Create temporary user creds
    var _creds = {
      usernameOrEmail: 'projectowner',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create user that will create the Project
    var _projectOwner = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'temp@test.com',
      username: _creds.usernameOrEmail,
      password: _creds.password,
      provider: 'local',
      roles: ['admin', 'user']
    });

    _projectOwner.save(function (err, _user) {
      // Handle save error
      if (err) {
        return done(err);
      }

      // Sign in with the user that will create the Project
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

          // Save a new project
          agent.post('/api/projects')
            .send(project)
            .expect(200)
            .end(function (projectSaveErr, projectSaveRes) {
              // Handle project save error
              if (projectSaveErr) {
                return done(projectSaveErr);
              }

              // Set assertions on new project
              (projectSaveRes.body.title).should.equal(project.title);
              should.exist(projectSaveRes.body.user);
              should.equal(projectSaveRes.body.user._id, userId);

              // now signin with the test suite user
              agent.post('/api/auth/signin')
                .send(credentials)
                .expect(200)
                .end(function (err, res) {
                  // Handle signin error
                  if (err) {
                    return done(err);
                  }

                  // Get the project
                  agent.get('/api/projects/' + projectSaveRes.body._id)
                    .expect(200)
                    .end(function (projectInfoErr, projectInfoRes) {
                      // Handle project error
                      if (projectInfoErr) {
                        return done(projectInfoErr);
                      }

                      // Set assertions
                      (projectInfoRes.body._id).should.equal(projectSaveRes.body._id);
                      (projectInfoRes.body.title).should.equal(project.title);
                      // Assert that the custom field "isCurrentUserOwner" is set to false since the current User didn't create it
                      (projectInfoRes.body.isCurrentUserOwner).should.equal(false);

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
      Project.remove().exec(done);
    });
  });
});
