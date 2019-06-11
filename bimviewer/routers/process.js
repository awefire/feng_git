'use strict';
/*create by fenglin on 2019/5/24.
* 形象进度接口
* */
const express = require('express'),
    router = express.Router(),
    multerFile = require('multer'),
    xlsx = require('node-xlsx'),
    fs = require('fs'),
    path = require('path'),
    config = require('../config/config'),
    fileModel = require('../models/File'),
    objectId = require('mongodb').ObjectId,
    MClient = require('mongodb');

let responseData;

router.use(function (req, res, next) {
   responseData={
      code : 0,
      message : String,
      data : []
   } ;
   next();
});

let uploadDir = config.uploadDir;

fs.exists(uploadDir,function (exists) {
    if (!exists){
        fs.mkdir(uploadDir,function () {

        });
    }
});
let storage = multerFile.diskStorage({
    destination : function (req, file, cb) {
        cb(null,uploadDir);
    },
    filename : function (req, file, cb) {
        cb(null,file.originalname);
    }
});

let upload = multerFile(
    {
        storage : storage,
        limits:{
            fileSize:1024*1024*1024//限制上传文件小于1G
        }
    }
);
let single = upload.single('upfile');

router.post('/create',function (req, res) {
    single(req,res,function (err) {
       if (err instanceof multerFile.MulterError){
           responseData.code=-1;
           responseData.message='上传失败';
           res.json(responseData);
       }
       else if (err){
           console.error(err);
           responseData.code=-1;
           responseData.message='上传失败';
           res.json(responseData);
       }
       else {
           let tfile = req.file;
           let userid = req.body.userId;
           let fileid = req.body.fileId;
           if (tfile == undefined || userid == undefined || fileid == undefined){
               responseData.code=-1;
               responseData.message='参数错误';
               res.json(responseData);
               return;
           }
           fs.exists(tfile.path,exist=>{
              if (exist){
                  try {
                      let excel = xlsx.parse(tfile.path);
                      let data = JSON.parse(JSON.stringify(excel));
                      let obj = {userId:String,fileId:String,data:Array};
                      obj.userId = userid;
                      obj.fileId = fileid;
                      obj.data = data;
                      MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err,client) {
                         if (err){
                             console.error(err);
                             responseData.code=-1;
                             responseData.message='形象进度生成失败';
                         } else {
                             let _collection = client.db(config.dataBase).collection(config.processCollection);
                             _collection.insertOne(obj,function (err,data) {
                                if (err){
                                    console.error(err);
                                    responseData.code=-1;
                                    responseData.message='形象进度生成失败';
                                }
                                else {
                                    fileModel.updateOne({_id:objectId(fileid),userid:userid},{addProcess: true},function (err, result) {
                                        if (err) console.error(err);
                                        else {
                                            responseData.message='形象进度生成成功';
                                            res.json(responseData);
                                        }
                                    });
                                    fs.unlink(tfile.path,function (err) {});
                                }
                             });
                         }
                      });
                  }
                  catch (e) {
                      console.error(e);
                      responseData.code=-1;
                      responseData.message='形象进度生成失败';
                  }
              }
              else {
                  responseData.code=-1;
                  responseData.message='形象进度生成失败';
              }
           });
       }
    });
});

router.post('/search',function (req, res) {
   let userid = req.body.userId,fileid = req.body.fileId;
   if (userid == undefined || fileid == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   }
   else {
       MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err,client) {
           if (err){
               console.error(err);
               responseData.code=-1;
               responseData.message='数据库连接失败';
           } else {
               let _collection = client.db(config.dataBase).collection(config.processCollection);
               _collection.findOne({userId:userid,fileId:fileid},function (err,data) {
                   if (err){
                       console.error(err);
                       responseData.code=-1;
                       responseData.message='数据库连接失败';
                   }
                   else {
                       if (Object.keys(data).length>0){
                           responseData.code=1;
                           responseData.message='形象进度数据';
                           responseData.data.push(data);
                           res.json(responseData);
                       }
                       else {
                           responseData.code=-1;
                           responseData.message='无数据';
                       }
                   }
               });
           }
       });
   }
});

router.post('/edit',function (req,res) {
    res.end('nothing...');
});

router.get('/test',function (req, res) {
   let data = xlsx.parse(path.join(__dirname,'test.xlsx'));
   res.json(JSON.stringify(data));
});

module.exports = router;
