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

    // Save a user to the test db and create new Project
    user.save(function () {
      project = {
        name: 'Project name'
      };

      done();
    });
  });

  it('should be able to save a Project if logged in', function (done) {
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

        // Save a new Project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle Project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Get a list of Projects
            agent.get('/api/projects')
              .end(function (projectsGetErr, projectsGetRes) {
                // Handle Projects save error
                if (projectsGetErr) {
                  return done(projectsGetErr);
                }

                // Get Projects list
                var projects = projectsGetRes.body;

                // Set assertions
                (projects[0].user._id).should.equal(userId);
                (projects[0].name).should.match('Project name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Project if not logged in', function (done) {
    agent.post('/api/projects')
      .send(project)
      .expect(403)
      .end(function (projectSaveErr, projectSaveRes) {
        // Call the assertion callback
        done(projectSaveErr);
      });
  });

  it('should not be able to save an Project if no name is provided', function (done) {
    // Invalidate name field
    project.name = '';

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

        // Save a new Project
        agent.post('/api/projects')
          .send(project)
          .expect(400)
          .end(function (projectSaveErr, projectSaveRes) {
            // Set message assertion
            (projectSaveRes.body.message).should.match('Please fill Project name');

            // Handle Project save error
            done(projectSaveErr);
          });
      });
  });

  it('should be able to update an Project if signed in', function (done) {
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

        // Save a new Project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle Project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Update Project name
            project.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Project
            agent.put('/api/projects/' + projectSaveRes.body._id)
              .send(project)
              .expect(200)
              .end(function (projectUpdateErr, projectUpdateRes) {
                // Handle Project update error
                if (projectUpdateErr) {
                  return done(projectUpdateErr);
                }

                // Set assertions
                (projectUpdateRes.body._id).should.equal(projectSaveRes.body._id);
                (projectUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Projects if not signed in', function (done) {
    // Create new Project model instance
    var projectObj = new Project(project);

    // Save the project
    projectObj.save(function () {
      // Request Projects
      request(app).get('/api/projects')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Project if not signed in', function (done) {
    // Create new Project model instance
    var projectObj = new Project(project);

    // Save the Project
    projectObj.save(function () {
      request(app).get('/api/projects/' + projectObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', project.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Project with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/projects/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Project is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Project which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Project
    request(app).get('/api/projects/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Project with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Project if signed in', function (done) {
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

        // Save a new Project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle Project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Delete an existing Project
            agent.delete('/api/projects/' + projectSaveRes.body._id)
              .send(project)
              .expect(200)
              .end(function (projectDeleteErr, projectDeleteRes) {
                // Handle project error error
                if (projectDeleteErr) {
                  return done(projectDeleteErr);
                }

                // Set assertions
                (projectDeleteRes.body._id).should.equal(projectSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Project if not signed in', function (done) {
    // Set Project user
    project.user = user;

    // Create new Project model instance
    var projectObj = new Project(project);

    // Save the Project
    projectObj.save(function () {
      // Try deleting Project
      request(app).delete('/api/projects/' + projectObj._id)
        .expect(403)
        .end(function (projectDeleteErr, projectDeleteRes) {
          // Set message assertion
          (projectDeleteRes.body.message).should.match('User is not authorized');

          // Handle Project error error
          done(projectDeleteErr);
        });

    });
  });

  it('should be able to get a single Project that has an orphaned user reference', function (done) {
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

          // Save a new Project
          agent.post('/api/projects')
            .send(project)
            .expect(200)
            .end(function (projectSaveErr, projectSaveRes) {
              // Handle Project save error
              if (projectSaveErr) {
                return done(projectSaveErr);
              }

              // Set assertions on new Project
              (projectSaveRes.body.name).should.equal(project.name);
              should.exist(projectSaveRes.body.user);
              should.equal(projectSaveRes.body.user._id, orphanId);

              // force the Project to have an orphaned user reference
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

                    // Get the Project
                    agent.get('/api/projects/' + projectSaveRes.body._id)
                      .expect(200)
                      .end(function (projectInfoErr, projectInfoRes) {
                        // Handle Project error
                        if (projectInfoErr) {
                          return done(projectInfoErr);
                        }

                        // Set assertions
                        (projectInfoRes.body._id).should.equal(projectSaveRes.body._id);
                        (projectInfoRes.body.name).should.equal(project.name);
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

  afterEach(function (done) {
    User.remove().exec(function () {
      Project.remove().exec(done);
    });
  });
});
