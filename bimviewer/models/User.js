'use strict';
/*create by fenglin on 2019/3/5.
* 定义用户数据模型
* */
var mongoose = require('mongoose');

module.exports = mongoose.model('User',new mongoose.Schema({
    userName : String,
    account : String,
    password : String
}));