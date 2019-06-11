'use strict';
/*create by fenglin on 2019/3/28.
* 标记数据模型
* */
const mongoose = require('mongoose');

module.exports = mongoose.model('tags',new mongoose.Schema({
    userId : String,
    modelId : String,
    msgId : String,
    title : String,
    color : Number,
    text : String,
    createTime:{type:Date,default:Date.now},
    updateTime:{type:Date,default:Date.now},
    geometry : Object
},
    {
        versionKey:false,
        timestamp:{createdAt: 'createTime',updatedAt: 'updateTime'}
    }
));
