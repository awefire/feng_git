'use strict';
/*create by fenglin on 2019/3/26.
* 视角书签接口
* */
const express = require('express'),
    router = express.Router(),
    uuid = require('uuid'),
    bookmodel = require('../models/BookMark'),
    tagmodel = require('../models/Tag');

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

//添加视角书签
router.post('/add', function (req, res) {
    let userid = req.body.userId;
    let modelid = req.body.modelId;
    let msgid = uuid.v1();
    let title = req.body.title;
    let color = req.body.color;
    let text = req.body.text;
    let geometry = req.body.geometry;
    let type = req.body.type;
    if (userid == undefined || modelid == undefined || title == undefined ||
        type == undefined || text == undefined || geometry == undefined || color == undefined){
        responseData.code=-1;
        responseData.message = '参数错误';
        res.json(responseData);
    } else {
        if (type == 'bookmark'){
            let newBook = new bookmodel({
                userId : userid,
                modelId : modelid,
                msgId: msgid,
                title: title,
                color : color,
                text: text,
                geometry:geometry
            });
            newBook.save().then(function (book) {
                responseData.message='视角书签保存成功';
                res.json(responseData);
            });
        }
       if (type == 'tag'){
           let newTag = new tagmodel({
               userId : userid,
               modelId : modelid,
               msgId: msgid,
               title: title,
               color : color,
               text: text,
               geometry:geometry
           });
           newTag.save().then(function (tag) {
               responseData.message='标记保存成功';
               res.json(responseData);
           });
       }
    }
});

//视角书签查询
router.post('/search',function (req, res) {
    let userid = req.body.userId;
    let modelid = req.body.modelId;
    let type = req.body.type;
    if (userid == undefined || modelid == undefined || type == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    } else {
        if (type == 'bookmark'){
            bookmodel.find({userId:userid,modelId: modelid}).sort({updateTime:-1}).exec(function (err, data) {
                if (err) console.error(err);
                else {
                    let arr = Object.keys(data);
                    if (arr.length > 0){
                        data.forEach( d => responseData.data.push(d));
                        responseData.code=1;
                        responseData.message='视角书签数据';
                        res.json(responseData);
                    } else {
                        responseData.code=-1;
                        responseData.message='无数据';
                        res.json(responseData);
                    }
                }
            });
        }
        if (type == 'tag'){
            tagmodel.find({userId:userid,modelId: modelid}).sort({updateTime: -1}).exec(function (err, data){
               if (err) console.error(err);
               else {
                   let arr = Object.keys(data);
                   if (arr.length > 0){
                       data.forEach(d => responseData.data.push(d) );
                       responseData.code=1;
                       responseData.message = '标记数据';
                       res.json(responseData);
                   } else {
                       responseData.code=-1;
                       responseData.message='无数据';
                       res.json(responseData);
                   }
               }
            });
        }
    }
});

//视角书签更新
router.post('/update',function (req, res) {
    let userid = req.body.userId;
    let modelid = req.body.modelId;
    let msgid = req.body.msgId;
    let title = req.body.title;
    let color = req.body.color;
    let text = req.body.text;
    let geometry = req.body.geometry;
    let type = req.body.type;
    if (userid == undefined || modelid == undefined || msgid == undefined || title == undefined ||
        type == undefined || text == undefined || color == undefined || geometry == undefined){
        responseData.code=-1;
        responseData.message = '参数错误';
        res.json(responseData);
    }else {
        if (type == 'bookmark'){
            bookmodel.updateOne({userId:userid,modelId:modelid,msgId: msgid},
                {title: title,color: color,text: text,geometry:geometry},
                function (err) {
                    if (err) {
                        responseData.code=-1;
                        responseData.message='修改失败';
                        res.json(responseData);
                    }
                    else {
                        responseData.message='修改成功';
                        res.json(responseData);
                    }
                });
        }
        if (type == 'tag'){
            tagmodel.updateOne({userId:userid,modelId:modelid,msgId: msgid},
                {title: title,color: color,text: text,geometry:geometry},
                function (err) {
                   if (err){
                       responseData.code = -1;
                       responseData.message = '修改失败';
                       res.json(responseData);
                   }
                   else {
                       responseData.message = '修改成功';
                       res.json(responseData);
                   }
                });
        }
    }
});

router.post('/delete',function (req, res) {
   let userid = req.body.userId,msgid = req.body.msgId,type = req.body.type;
   if (userid == undefined||msgid == undefined||type == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   }
   else {
       if (type == 'bookmark'){
           bookmodel.deleteOne({userId:userid,msgId:msgid},function (err) {
               if (err){
                   responseData.code=-1;
                   responseData.message='删除失败';
                   res.json(responseData);
               } else {
                   responseData.message='删除成功';
                   res.json(responseData);
               }
           });
       }
       else if (type == 'tag'){
           tagmodel.deleteOne({userId:userid,msgId:msgid},function (err) {
               if (err){
                   responseData.code=-1;
                   responseData.message='删除失败';
                   res.json(responseData);
               } else {
                   responseData.message='删除成功';
                   res.json(responseData);
               }
           });
       }
   }
});


module.exports = router;
