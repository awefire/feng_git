'use strict';
/*create by fenglin on 2019/3/28.
* 搜索接口
* */
const express = require('express'),
    MClient = require('mongodb').MongoClient,
    fileModel = require('../models/File'),
    config = require('../config/config'),
    bookmodel = require('../models/BookMark'),
    tagmodel = require('../models/Tag'),
    utils = require('../tools/utils'),
    router = express.Router();

let responseData;
router.use(function (req, res, next) {
    responseData = {
        code : 0,
        message : String,
        data:[]
    } ;
    next();
});

router.post('/fuzzy',function (req, res) {

    let userid = req.body.userId,modelid = req.body.modelId,type = req.body.type,filter = req.body.filter;
    /*modelId为数组*/
    if (userid == undefined || modelid == undefined || type == undefined || filter == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    } else {
        if (type == 'file'){//文件模糊搜索
            let query = {};
            query['userId'] = userid;
            query['fileName'] = new RegExp(filter);
            fileModel.find(query,function (err, data) {
                if (err) console.error(err);
                else {
                    if (data == undefined){
                        responseData.code=-1;
                        responseData.message='无数据';
                        res.json(responseData);
                        return;
                    }
                    let arr = Object.keys(data);
                    if (arr.length > 0){
                        data.forEach( d => responseData.data.push(d));
                        responseData.code=1;
                        responseData.message='文件数据';
                        res.json(responseData);
                    } else {
                        responseData.code=-1;
                        responseData.message='无数据';
                        res.json(responseData);
                    }

                }
            });

        }
        /*else if (type == 'global'){
            let property = [],bookmark = [],tag = [];
            MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err, client) {
               if (err){
                   responseData.code=-1;
                   responseData.message='查询失败';
                   res.json(responseData);
               }  else {
                   let query1 = {};
                   let query = {};
                   query['tittle'] = new RegExp(filter);
                   query['text'] = new RegExp(filter);
                   query1['Name'] = new RegExp(filter);
                   query1['ObjectType'] = new RegExp(filter);
                   query1['ObjectPlacement'] = new RegExp(filter);
                   query1['Tag'] = new RegExp(filter);
                   query1['Reference'] = new RegExp(filter);
                   let _collection = client.db(config.dataBase).collection(config.propertyCollection);
                   _collection.find(query1,function (err,data) {
                       if (err) console.error(err);
                       else {
                           if (data){
                               property.push(data);
                               bookmarkmodel.find(query,function (err, data) {
                                   if (err) console.error(err);
                                   else {
                                       if (data){
                                           bookmark.push(data);
                                           tagmodel.find(query,function (err, data) {
                                               if (err) console.error(err);
                                               else {
                                                   tag.push(data);
                                                   if (!property && !bookmark && !tag){
                                                       responseData.code=-1;
                                                       responseData.message='无数据';
                                                       res.json(responseData);
                                                   } else {
                                                       let datastr = JSON.stringify("{\"property\":"+property
                                                           +",\"bookmark\":"+bookmark+",\"tag\":"+tag+"}");
                                                       responseData.data.push(datastr);
                                                       responseData.code=1;
                                                       responseData.message='查询成功';
                                                       res.json(responseData);
                                                   }
                                               }
                                           });
                                       }
                                   }
                               });
                           }
                       }
                   });
               }
            });
        }*/
        else if (type == 'property'){
            let total_data = [];
            for(let i=0;i<modelid.length;i++){
                let query = {};
                query['userId'] = userid;
                query['modelId'] = modelid[i];
                query['values'] = new RegExp(filter);
                MClient.connect(config.mongoURL,{useNewUrlParser:true},(err,client)=>{
                    if (err) console.error(err);
                    else {
                        let _collection = client.db(config.dataBase).collection(config.propertyCollection);
                        _collection.find(query).toArray((err,data)=>{
                            if (err) console.error(err);
                            else {
                                let arr = Object.keys(data);
                                if (arr.length>0){
                                    data.forEach(d => total_data.push(d));
                                }
                                if (i == modelid.length-1){
                                    if (total_data.length>0){
                                        responseData.code=1;
                                        responseData.message='属性数据';
                                        responseData.data = total_data;
                                        res.json(responseData);
                                    } else {
                                        responseData.code=-1;
                                        responseData.message='无数据';
                                        res.json(responseData);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }
        else if (type == 'bookmark') {
            let total_data = [];
            for (let i=0;i<modelid.length;i++){
                let query = {};
                query['userId'] = userid;
                query['modelId'] = modelid[i];
                query['title'] = new RegExp(filter);
                bookmodel.find(query,function (err, data) {
                    if (err) console.error(err);
                    else {
                        let arr = Object.keys(data);
                        if (arr.length > 0){
                            data.forEach( d => total_data.push(d));
                        }
                        if (i == modelid.length-1)
                        {
                            if (total_data.length > 0){
                                responseData.code=1;
                                responseData.message='视角书签数据';
                                responseData.data = total_data;
                                res.json(responseData);
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
        else if (type == 'tag') {
            let total_data = [];
            for (let i=0;i<modelid.length;i++){
                let query = {};
                query['userId'] = userid;
                query['modelId'] = modelid[i];
                query['title'] = new RegExp(filter);
                tagmodel.find(query,function (err, data) {
                    if (err) console.error(err);
                    else {
                        let arr = Object.keys(data);
                        if (arr.length>0){
                            data.forEach( d => total_data.push(d));
                        }
                        if (i == modelid.length-1){
                            if (total_data.length>0){
                                responseData.code=1;
                                responseData.message='标注数据';
                                responseData.data=total_data;
                                res.json(responseData);
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
    }
});

module.exports = router;
