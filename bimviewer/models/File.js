'use strict';
/*create by fenglin on 2019/3/5.
* 定义文件存储模型
* */

var mongoose = require('mongoose');

module.exports = mongoose.model('File',new mongoose.Schema({
    userId : String,
    modelId : String,
    groupId:Array,
    date : String,
    path : String,
    gridId:String,
    tag : String,
    project : String,
    type : Number,
    fileName : String,
    fileType : String,
    modelType:String,
    fileSize:String,
    deleted : Boolean,
    status : Number,
    addProcess : {type: Boolean,default:false}
}));
