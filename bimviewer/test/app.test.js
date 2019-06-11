'use strict';
/*create by fenglin on 2019/5/8.
* unint http api test
* */

const app = require('../app'),
    should = require('should'),
    request = require('supertest');

describe('http api test',()=>{
    it('user register test',function (done){
       request(app)
           .post('/user/register')
           .send('account=15711111112')
           .send('password=djskaldhsajddsd')
           .set('Accept','application/json')
           .expect('Content-Type',/json/)
           .expect(200,{code:0,message:'注册成功',data:[]},done)
   }) ;
    it('user login test ', function (done) {
        request(app)
            .post('/user/login')
            .send('account=157111111112')
            .send('password=djskaldhsajddsd')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {console.error(err);
                return done(err);
                } else
                    done();
            })
    });
    it('file single upload test', function (done) {
        request(app)
            .post('/file/singleupload')
            .field('userId','5cd23f7067cbe5287811fd9a')
            .field('tag','A')
            .field('project','A1')
            .field('type','1')
            .field('name','upfile')
            .attach('upfile','E:\\testifcdata\\FourWalls.xml')
            .expect(200,{code:0,message: '上传成功',data: []},done)
    });
    it('file list test', function (done) {
        request(app)
            .post('/file/listfile')
            .send('tag=A')
            .send('project=A1')
            .send('type=1')
            .send('userId=5cd23f7067cbe5287811fd9a')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function (err, res) {
                if (err){
                    console.error(err);
                    return done(err);
                }else {
                    should(res.body.data).have.length(1);
                    done();
                }
            })
    });
    it('file delete test', function (done) {
        request(app)
            .post('/file/delete')
            .send('fileId=5cd24482ddb56c3f58ea03fc')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200,{code:0,message:'删除成功',data:[]},done)
    });
    it('file trash test', function (done) {
        request(app)
            .post('/file/trash')
            .send('userId=5cd23f7067cbe5287811fd9a')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function (err, res) {
                if (err){
                    console.error(err);
                    return done(err);
                } else {
                    should(res.body.data).have.length(1);
                    done();
                }
            })
    });
    it('file list test', function (done) {
        request(app)
            .post('/file/listfile')
            .send('userId=5ca5cb681348f45b04d577c0')
            .send('tag=A')
            .send('project=A')
            .send('type=1')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function (err, res) {
                if (err){
                    console.error(err);
                    return done(err);
                } else {
                    if (res.data.length > 0)
                        done();
                }
            })
    });
});
