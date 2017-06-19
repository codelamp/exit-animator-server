process.env.TEST = true;

var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {

  before('wait for server readiness', function(done){
    this.timeout(5000);
    server.on('ready:swangoose', done);
  });

  describe('animation', function() {
    
    var createdAnimation = null;
    
    describe('POST /animation', function() {
      
      it('should create a new animation called "Animation 1"', function(done) {
        // we have to wait for the server to be set up.
        request(server)
          .post('/api/animation')
          .send({ "name": 'Animation 1 #testing' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            createdAnimation = res.body;
            should.exist(createdAnimation.name);
            should.exist(createdAnimation._id);
            done();
          })
        ;
      });
      
    });

    describe('GET /animation', function() {
      
      it('should return a list of available animation ids', function(done) {
        // we have to wait for the server to be set up.
        request(server)
          .get('/api/animation')
          //.query({ name: 'Scott'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.an.Array();
            res.body[0].should.be.a.String();
            done();
          })
        ;
      });
      
    });
    
    describe('GET /animation/{animation_id}', function() {
      
      it('should return the animation found by animation id', function(done) {
        
        // we have to wait for the server to be set up.
        request(server)
          .get('/api/animation/' + createdAnimation._id)
          //.query({ name: 'Scott'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            done();
          })
        ;
      });

    });
    
    describe('PUT /animation/{animation_id}', function() {
      
      it('should update the animation found by animation id', function(done) {
        
        // we have to wait for the server to be set up.
        request(server)
          .put('/api/animation/' + createdAnimation._id)
          .send({ "name": 'Animation 1 (updated) #testing' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            done();
          })
        ;
      });

    });
    
    
    describe('GET /animation/{animation_id} (2)', function() {
      
      it('confirm that previous put actually made a change', function(done) {
        
        // we have to wait for the server to be set up.
        request(server)
          .get('/api/animation/' + createdAnimation._id)
          //.query({ name: 'Scott'})
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.name.should.be.exactly('Animation 1 (updated) #testing');
            done();
          })
        ;
      });

    });
    
    describe('DELETE /animation/{animation_id}', function() {
      
      it('should delete the animation found by animation id', function(done) {
        
        // we have to wait for the server to be set up.
        request(server)
          .delete('/api/animation/' + createdAnimation._id)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.success.should.be.a.Boolean();
            res.body.success.should.be.exactly(true);
            done();
          })
        ;
      });

    });

  });

});