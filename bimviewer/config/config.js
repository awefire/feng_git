'use strict';
/*create by fenglin on 2019/3/18.
* 配置公共资源
* */
const path = require('path');
module.exports={
    /*监听端口*/
    port:'80',
    /*数据库地址*/
    mongoURL:'mongodb://user1:Passw0rd@192.168.2.235:27017/bimviewer?authSource=admin',
    /*API资源地址*/
    serviceUrl:'http://192.168.2.235:80',
    /*后台接口地址*/
    ajaxUrl:'http://192.168.2.235:80',
    /*数据库名*/
    dataBase:'bimviewer',
    /*解析后几何数据表名*/
    geometryCollection:'geometries',
    /*解析后结构树表名*/
    treeCollection:'trees',
    /*解析后属性表名*/
    propertyCollection:'properties',
    /*形象进度数据表*/
    processCollection:'process',
    /*上传文件路径*/
    uploadDir:path.join(path.resolve(__dirname,'../../'),'upload'),
    /*几何数据文件路径*/
    geometryDir:path.join(path.join(path.resolve(__dirname,'../../'),'upload'),'geometries'),
    /*autoSrc文件路径(取到bim.viewer.api中的autoSrc.js)*/
    autoSrc:path.join(path.resolve(__dirname,'../'),'api/bim.viewer.api/public/src/autoSrc.js')
};
