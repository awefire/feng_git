'use strict';
/*create by fenglin on 2019/3/8.
* 模型数据接口
* */
const express = require('express'),
     router = express.Router(),
     MClient = require('mongodb').MongoClient,
     filemodel = require('../models/File'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../tools/utils'),
    mime = require('mime'),
     config = require('../config/config');

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

//结构树数据
router.post('/tree',function (req, res) {
    let userid = req.body.userId;
    let modelid = req.body.modelId;
    if (modelid == undefined || userid == undefined){
        responseData.code = -1;
        responseData.message = "参数错误";
        res.json(responseData);
    }
    else {
        userid = userid.substr(0,24);
        modelid = modelid.substr(0,36);
        MClient.connect(config.mongoURL,{useNewUrlParser : true},function (err, client) {
            if (err){
                responseData.code = -1;
                responseData.message = '数据库连接失败';
                res.json(responseData);
            }else {
                const  _db = client.db(config.dataBase);
                const  _collection = _db.collection(config.treeCollection);
                _collection.findOne({userId:userid,modelId:modelid},function (err, data) {
                    if (err) {
                        console.log(err);
                    }else {
                        if (data == undefined){
                            responseData.code=-1;
                            responseData.message='无数据';
                            res.json(responseData);
                            return;
                        }
                        if (Object.keys(data).length>0){
                            responseData.code=1;
                            responseData.message='结构树数据';
                            responseData.data.push(data.data);
                            res.json(responseData);
                        } else {
                            responseData.code=-1;
                            responseData.message='无数据';
                            res.json(responseData);
                        }
                    }
                });
            }
        });
    }
});

//属性数据
router.post('/property',function (req, res) {
    let userid = req.body.userId;
   let modelid = req.body.modelId;
   let member = req.body.guid;
   if (modelid == undefined || userid == undefined || member == undefined){
       responseData.code = -1;
       responseData.message = '参数错误';
       res.json(responseData);
   }
   else {
       userid = userid.substr(0,24);
       modelid = modelid.substr(0,36);
       MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err, client) {
           if (err){
               responseData.code = -1;
               responseData.message = '连接数据库失败';
               res.json(responseData);
           }
           else {
               let _collection = client.db(config.dataBase).collection(config.propertyCollection);
               _collection.findOne({userId:userid,modelId: modelid,guid:member},function (err, data) {
                   if (err) console.log(err);
                   else {
                       if (data == undefined){
                           responseData.code=-1;
                           responseData.message='无数据';
                           res.json(responseData);
                           return;
                       }
                       if (Object.keys(data).length>0){
                           responseData.code=1;
                           responseData.message='属性数据';
                           responseData.data.push(data);
                           res.json(responseData);
                       } else {
                           responseData.code=-1;
                           responseData.message='无数据';
                           res.json(responseData);
                       }
                   }
               });
           }
       });
   }
});

//告知前端几何数据的数量(非obj文件类型模型)
router.get('/total_geometry',function (req, res) {
    let userid = req.query.userId,modelid = req.query.modelId;
    if (userid == undefined || modelid == undefined){
        responseData.code = -1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        userid = userid.substr(0,24);
        modelid = modelid.substr(0,36);
        let params = {"path":{},"Canvas":{"model":{}}};//构建拼接字符串
        params.path.serviceUrl = config.serviceUrl;
        params.path.ajaxUrl = config.ajaxUrl;
        params.path.userId = userid;
        params.path.modelId = modelid;

        filemodel.findOne({
            userId:userid,
            modelId:modelid
        }).then(function (fileInfo) {
            if (fileInfo){
                params.Canvas.model.reference = fileInfo.modelType;
                params.Canvas.model.talbe = fileInfo.fileName;
                params.Canvas.model.callback = '&callback=loader';
                if (fileInfo.modelType == 'kbim' || fileInfo.modelType == 'ifc' || fileInfo.modelType == 'rvt'){//非obj文件类型模型
                    MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err, client) {
                        if (err) console.log(err);
                        let _collection = client.db(config.dataBase).collection(config.geometryCollection);
                        _collection.countDocuments({userId:userid,modelId:modelid},function (err,count) {
                            if (err)console.log(err);
                            else {
                                if (count < 50){
                                    params.Canvas.model.page = count;
                                    params.Canvas.model.total = 1;
                                    _collection.findOne({userId:userid,modelId:modelid},function (err, doc) {
                                        if (err)console.error(err);
                                        else{
                                            params.Canvas.model.scene = doc.scene;
                                        }
                                    });
                                } else {
                                    let items = count%50 == 0?(count/50):Math.ceil(count/50);//每次请求的条数
                                    let req_count = count%items==0?(count/items):Math.ceil(count/items);//请求次数
                                    params.Canvas.model.page = items;
                                    params.Canvas.model.total = req_count;
                                }
                                params.Canvas.model.url = '/model/geometry?userId='+userid+'&&modelId='+modelid+'&&total='+params.Canvas.model.total+'&&mp=';
                                res.end(req.query.callback+'&&'+req.query.callback+'('+JSON.stringify(params)+')');
                            }
                        });
                    });
                }
                else if (fileInfo.modelType == 'obj') {
                    params.Canvas.model.page = 1;
                    params.Canvas.model.total = 1;
                    params.Canvas.model.url = '/model/obj_geometry?userId='+req.query.userId+'&&modelId='+req.query.modelId+'&&fileName=';
                    res.end(req.query.callback+'&&'+req.query.callback+'('+JSON.stringify(params)+')');
                }
                else {
                    params.Canvas.model.page = 1;
                    params.Canvas.model.total = 1;
                    params.Canvas.model.url = '/model/other_geometry?userId='+req.query.userId+'&&modelId='+req.query.modelId;
                    res.end(req.query.callback+'&&'+req.query.callback+'('+JSON.stringify(params)+')');
                }
            }
            else {
                responseData.code=-1;
                responseData.message='找不到模型';
                res.json(responseData);
            }
        });
    }
});

//非obj文件类模型几何数据接口
router.get('/geometry',function (req, res) {
    let userid = req.query.userId;
   let modelid = req.query.modelId;
   let total = req.query.total;
   let index = req.query.mp;
   let page = parseInt(req.query.page);
   if (userid == undefined||modelid == undefined||total == undefined||index == undefined||page == undefined){
       responseData.code = -1;
       responseData.message='参数错误';
       res.json(responseData);
   }
   else {
       userid = userid.substr(0,24);
       modelid = modelid.substr(0,36);
       if (index == null)
           index=0;
       if (page == null)
           page=10;
       MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err, client) {
           if (err){
               responseData.code=-1;
               responseData.message='数据库连接失败';
               res.json(responseData);
           }
           else {
               let _collection = client.db(config.dataBase).collection(config.geometryCollection);
               if (index < total - 1) {
                   _collection.find({userId: userid, modelId: modelid}).limit(page).skip(index * page).toArray(function (err, docs) {
                       if (err) {
                           console.error(err);
                       }
                       else {
                           if (docs == undefined){
                               responseData.code=-1;
                               responseData.message='无数据';
                               res.json(responseData);
                               return;
                           }
                           if (Object.keys(docs).length>0){
                               let docs_new = [];
                               for (let i in docs) {
                                   let geo_path = path.join(config.geometryDir,modelid,docs[i].path);
                                   let geo_data = JSON.parse(fs.readFileSync(geo_path).toString());
                                   docs_new.push(geo_data.data);
                               }
                               res.end(req.query.callback + '&&' + req.query.callback + '(' + JSON.stringify(docs_new) + ')');
                           }
                            else {
                               responseData.code=-1;
                               responseData.message='无数据';
                               res.json(responseData);
                           }
                       }
                   });
               }
               else {//最后一次请求将剩余数据全部返回
                   _collection.find({userId: userid, modelId: modelid}).skip(index * page).toArray(function (err, docs) {
                       if (err) console.error(err);
                       else {
                           if (docs == undefined){
                               responseData.code=-1;
                               responseData.message='无数据';
                               res.json(responseData);
                               return;
                           }
                           else {
                               if (Object.keys(docs).length>0){
                                   let doc_new = [];
                                   for (let i in docs) {
                                       let geo_path = path.join(config.geometryDir,modelid,docs[i].path);
                                       let geo_data = JSON.parse(fs.readFileSync(geo_path).toString());
                                       doc_new.push(geo_data.data);
                                   }
                                   res.end(req.query.callback + '&&' + req.query.callback + '(' + JSON.stringify(doc_new) + ')');
                               }
                               else {
                                   responseData.code=-1;
                                   responseData.message='无数据';
                                   res.json(responseData);
                               }
                           }

                       }
                   });
               }
           }
       });
   }
});

//obj类型模型几何数据
router.get('/obj_geometry',function (req, res) {
    let userid = req.query.userId;
    let modelid = req.query.modelId;
    let filename = req.query.fileName;
    if (userid == undefined||modelid == undefined||filename == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        userid = userid.substr(0,24);
        modelid = modelid.substr(0,36);
        let filetype = filename.substr(filename.lastIndexOf('.')+1);
        filemodel.findOne({userId:userid,modelId:modelid}).then(function (fileInfo) {
            if (fileInfo){
                let filepath = path.dirname(path.join(config.uploadDir,fileInfo.path));
                if (filetype == 'obj' || filetype == 'mtl'){
                    let objmtl_file = path.join(filepath,filename);
                    fs.exists(objmtl_file,(exist)=>{
                       if (exist){
                           let data = fs.readFileSync(objmtl_file);
                           res.send(data.toString());
                       }  else {
                           responseData.code=-1;
                           responseData.message='找不到文件';
                           res.json(responseData);
                       }
                    });
                }
                else {
                    filename=filename.replace('\\','/');
                    let image_file = path.join(filepath,filename);
                    let img_type = mime.getType(image_file);
                    fs.exists(image_file,(exist)=>{
                       if (exist)  {
                           res.writeHead(200,{'Content-Type':img_type});
                           let read = fs.createReadStream(image_file);
                           let stream = [];
                           read.on('data',function (chunk) {
                               stream.push(chunk);
                           });
                           read.on('end',function () {
                               let final = Buffer.concat(stream);
                               res.write(final);
                               res.end();
                           });
                       }
                       else {
                           responseData.code=-1;
                           responseData.message='找不到文件';
                           res.json(responseData);
                       }
                    });
                }
            }else {
                responseData.code=-1;
                responseData.message='找不到此文件';
                res.json(responseData);
            }
        });
    }
});

router.get('/other_geometry',function (req, res) {
    let userid = req.query.userId;
    let modelid = req.query.modelId;
    userid = userid.substr(0,24);
    modelid = modelid.substr(0,36);
    filemodel.findOne({userId:userid,modelId:modelid}).then(fileInfo=>{
        let modelpath = path.join(config.uploadDir,fileInfo.path);
        fs.exists(modelpath,(exist)=>{
           if (exist){
               let modeltype = mime.getType(modelpath);
               res.writeHead(200,{'Content-Type':modeltype});
               let read = fs.createReadStream(modelpath);
               let stream = [];
               read.on('data',function (chunk) {
                   stream.push(chunk);
               });
               read.on('end',function () {
                   let final = Buffer.concat(stream);
                   res.write(final);
                   res.end();
               });
           }
           else {
               responseData.code=-1;
               responseData.message='找不到文件';
               res.json(responseData);
           }
        });
    }).catch(err=>console.error(err));
});

module.exports = router;
