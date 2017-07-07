'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Proposal = mongoose.model('Proposal'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  proposal;

/**
 * Proposal routes tests
 */
describe('Proposal CRUD tests', function () {

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

    // Save a user to the test db and create new Proposal
    user.save(function () {
      proposal = {
        name: 'Proposal name'
      };

      done();
    });
  });

  it('should be able to save a Proposal if logged in', function (done) {
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

        // Save a new Proposal
        agent.post('/api/proposals')
          .send(proposal)
          .expect(200)
          .end(function (proposalSaveErr, proposalSaveRes) {
            // Handle Proposal save error
            if (proposalSaveErr) {
              return done(proposalSaveErr);
            }

            // Get a list of Proposals
            agent.get('/api/proposals')
              .end(function (proposalsGetErr, proposalsGetRes) {
                // Handle Proposals save error
                if (proposalsGetErr) {
                  return done(proposalsGetErr);
                }

                // Get Proposals list
                var proposals = proposalsGetRes.body;

                // Set assertions
                (proposals[0].user._id).should.equal(userId);
                (proposals[0].name).should.match('Proposal name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Proposal if not logged in', function (done) {
    agent.post('/api/proposals')
      .send(proposal)
      .expect(403)
      .end(function (proposalSaveErr, proposalSaveRes) {
        // Call the assertion callback
        done(proposalSaveErr);
      });
  });

  it('should not be able to save an Proposal if no name is provided', function (done) {
    // Invalidate name field
    proposal.name = '';

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

        // Save a new Proposal
        agent.post('/api/proposals')
          .send(proposal)
          .expect(400)
          .end(function (proposalSaveErr, proposalSaveRes) {
            // Set message assertion
            (proposalSaveRes.body.message).should.match('Please fill Proposal name');

            // Handle Proposal save error
            done(proposalSaveErr);
          });
      });
  });

  it('should be able to update an Proposal if signed in', function (done) {
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

        // Save a new Proposal
        agent.post('/api/proposals')
          .send(proposal)
          .expect(200)
          .end(function (proposalSaveErr, proposalSaveRes) {
            // Handle Proposal save error
            if (proposalSaveErr) {
              return done(proposalSaveErr);
            }

            // Update Proposal name
            proposal.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Proposal
            agent.put('/api/proposals/' + proposalSaveRes.body._id)
              .send(proposal)
              .expect(200)
              .end(function (proposalUpdateErr, proposalUpdateRes) {
                // Handle Proposal update error
                if (proposalUpdateErr) {
                  return done(proposalUpdateErr);
                }

                // Set assertions
                (proposalUpdateRes.body._id).should.equal(proposalSaveRes.body._id);
                (proposalUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Proposals if not signed in', function (done) {
    // Create new Proposal model instance
    var proposalObj = new Proposal(proposal);

    // Save the proposal
    proposalObj.save(function () {
      // Request Proposals
      request(app).get('/api/proposals')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Proposal if not signed in', function (done) {
    // Create new Proposal model instance
    var proposalObj = new Proposal(proposal);

    // Save the Proposal
    proposalObj.save(function () {
      request(app).get('/api/proposals/' + proposalObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', proposal.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Proposal with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/proposals/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Proposal is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Proposal which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Proposal
    request(app).get('/api/proposals/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Proposal with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Proposal if signed in', function (done) {
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

        // Save a new Proposal
        agent.post('/api/proposals')
          .send(proposal)
          .expect(200)
          .end(function (proposalSaveErr, proposalSaveRes) {
            // Handle Proposal save error
            if (proposalSaveErr) {
              return done(proposalSaveErr);
            }

            // Delete an existing Proposal
            agent.delete('/api/proposals/' + proposalSaveRes.body._id)
              .send(proposal)
              .expect(200)
              .end(function (proposalDeleteErr, proposalDeleteRes) {
                // Handle proposal error error
                if (proposalDeleteErr) {
                  return done(proposalDeleteErr);
                }

                // Set assertions
                (proposalDeleteRes.body._id).should.equal(proposalSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Proposal if not signed in', function (done) {
    // Set Proposal user
    proposal.user = user;

    // Create new Proposal model instance
    var proposalObj = new Proposal(proposal);

    // Save the Proposal
    proposalObj.save(function () {
      // Try deleting Proposal
      request(app).delete('/api/proposals/' + proposalObj._id)
        .expect(403)
        .end(function (proposalDeleteErr, proposalDeleteRes) {
          // Set message assertion
          (proposalDeleteRes.body.message).should.match('User is not authorized');

          // Handle Proposal error error
          done(proposalDeleteErr);
        });

    });
  });

  it('should be able to get a single Proposal that has an orphaned user reference', function (done) {
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

          // Save a new Proposal
          agent.post('/api/proposals')
            .send(proposal)
            .expect(200)
            .end(function (proposalSaveErr, proposalSaveRes) {
              // Handle Proposal save error
              if (proposalSaveErr) {
                return done(proposalSaveErr);
              }

              // Set assertions on new Proposal
              (proposalSaveRes.body.name).should.equal(proposal.name);
              should.exist(proposalSaveRes.body.user);
              should.equal(proposalSaveRes.body.user._id, orphanId);

              // force the Proposal to have an orphaned user reference
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

                    // Get the Proposal
                    agent.get('/api/proposals/' + proposalSaveRes.body._id)
                      .expect(200)
                      .end(function (proposalInfoErr, proposalInfoRes) {
                        // Handle Proposal error
                        if (proposalInfoErr) {
                          return done(proposalInfoErr);
                        }

                        // Set assertions
                        (proposalInfoRes.body._id).should.equal(proposalSaveRes.body._id);
                        (proposalInfoRes.body.name).should.equal(proposal.name);
                        should.equal(proposalInfoRes.body.user, undefined);

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
      Proposal.remove().exec(done);
    });
  });
});
