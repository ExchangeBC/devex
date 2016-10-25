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
describe('Project Admin CRUD tests', function () {
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

    // Save a user to the test db and create new project
    user.save(function () {
      project = {
        title: 'Project Title',
        content: 'Project Content'
      };

      done();
    });
  });

  it('should be able to save an project if logged in', function (done) {
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

        // Save a new project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Get a list of projects
            agent.get('/api/projects')
              .end(function (projectsGetErr, projectsGetRes) {
                // Handle project save error
                if (projectsGetErr) {
                  return done(projectsGetErr);
                }

                // Get projects list
                var projects = projectsGetRes.body;

                // Set assertions
                (projects[0].user._id).should.equal(userId);
                (projects[0].title).should.match('Project Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to update an project if signed in', function (done) {
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

        // Save a new project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Update project title
            project.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing project
            agent.put('/api/projects/' + projectSaveRes.body._id)
              .send(project)
              .expect(200)
              .end(function (projectUpdateErr, projectUpdateRes) {
                // Handle project update error
                if (projectUpdateErr) {
                  return done(projectUpdateErr);
                }

                // Set assertions
                (projectUpdateRes.body._id).should.equal(projectSaveRes.body._id);
                (projectUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an project if no title is provided', function (done) {
    // Invalidate title field
    project.title = '';

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

        // Save a new project
        agent.post('/api/projects')
          .send(project)
          .expect(422)
          .end(function (projectSaveErr, projectSaveRes) {
            // Set message assertion
            (projectSaveRes.body.message).should.match('Title cannot be blank');

            // Handle project save error
            done(projectSaveErr);
          });
      });
  });

  it('should be able to delete an project if signed in', function (done) {
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

        // Save a new project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
            }

            // Delete an existing project
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

  it('should be able to get a single project if signed in and verify the custom "isCurrentUserOwner" field is set to "true"', function (done) {
    // Create new project model instance
    project.user = user;
    var projectObj = new Project(project);

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

        // Save a new project
        agent.post('/api/projects')
          .send(project)
          .expect(200)
          .end(function (projectSaveErr, projectSaveRes) {
            // Handle project save error
            if (projectSaveErr) {
              return done(projectSaveErr);
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

                // Assert that the "isCurrentUserOwner" field is set to true since the current User created it
                (projectInfoRes.body.isCurrentUserOwner).should.equal(true);

                // Call the assertion callback
                done();
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
