'use strict';
/*create by fenglin on 2019/3/26.
* 视角书签数据模型
* */
var mongoose = require('mongoose');

module.exports = mongoose.model('bookmark',new mongoose.Schema({
    userId:String,
    modelId:String,
    msgId:String,
    title:String,
    color:Number,
    text:String,
    createTime:{type:Date,default:Date.now},
    updateTime:{type:Date,default:Date.now},
    geometry: Object
},
    {
        versionKey:false,
        timestamp:{createdAt: 'createTime',updatedAt: 'updateTime'}
    }
));
