'use strict';
const express = require('express'),
     router = express.Router(),
     User = require('../models/User'),
     ObjectId = require('mongodb').ObjectID;

//定义统一返回格式
var responseData;
router.use(function (req, res, next) {
    responseData = {
        code : 0,
        message : String,
        data:[]
    } ;
    next();
});

//用户注册接口
router.post('/register',function (req, res) {
    let username = "默认用户名";//用户名,初始为默认
    let account = req.body.account;//用户账号
    let password = req.body.password;//密码
    if (account == undefined || password == undefined || account==''||password==''){
        responseData.code = -1;
        responseData.message = "用户名或密码不能为空!";
        res.json(responseData);
    }
    else {
        User.findOne({
            account: account
        }).then(function (userInfo) {
            if (userInfo){//用户已存在
                responseData.code = -1;
                responseData.message = "用户已存在";
                res.json(responseData);
            }else {
                let user = new User({
                    userName : username,
                    account : account,
                    password : password
                });
                user.save(function (err) {
                    if (err){
                        responseData.code = -1;
                        responseData.message = "注册失败";
                        res.json(responseData);
                    }else {
                        responseData.code=0;
                        responseData.message = "注册成功";
                        res.json(responseData);
                    }
                });
            }
        });
    }
});

//用户登录接口
router.post('/login',function (req, res) {
    let account = req.body.account;
    let password = req.body.password;
    if (account == undefined || password == undefined ||account == '' || password == '') {
        responseData.code = -1;
        responseData.message = "用户名或密码不能为空!";
        res.json(responseData);
    }
    else {
        User.findOne({
            account : account,
        }).then(function (userInfo) {
            if (!userInfo) {
                responseData.code = -1;
                responseData.message = "用户不存在!";
                res.json(responseData);
            }else {
                User.findOne({
                    account : account,
                    password : password
                }).then(function (userInfo) {
                    if (userInfo) {
                        let userData = {
                            userId :userInfo._id,
                            userName :userInfo.userName,
                            account : userInfo.account,
                            password : userInfo.password
                        };
                        responseData.code = 1;
                        responseData.message = '登录成功';
                        responseData.data.push(userData);
                        res.json(responseData);
                    }else {
                        responseData.code = -1;
                        responseData.message = "密码错误";
                        res.json(responseData);
                    }
                });
            }
        });
    }
});

//修改用户名
router.post('/changename',function (req, res) {
   let userid = req.body.userId;
   let username = req.body.userName;
   if (username == undefined || username == ''){
       responseData.code = -1;
       responseData.message = '用户名不能为空';
       res.json(responseData);
   } else {
       User.updateOne({_id:ObjectId(userid)},{userName:username},function (err) {
           if (err) {
               responseData.code = -1;
               responseData.message = '修改失败';
               res.json(responseData);
           }
           else {
               responseData.message='修改成功';
               res.json(responseData);
           }
       });
   }
});

module.exports = router;