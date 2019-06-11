'use strict';
const express = require('express'),
     bodyParser = require('body-parser'),
     mongoose = require('mongoose'),
     config = require('./config/config'),
    fs = require('fs'),
     app = express();

//设置跨域
app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    res.header('Access-Control-Allow-Credentials','true');
    //允许的header类型
    res.header("Access-Control-Allow-Headers","X-Requested-With,cache-control");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    if (req.method.toLowerCase() == 'options')
        res.sendStatus(200);  //让options尝试请求快速结束
    else
        next();
});

app.use(bodyParser.urlencoded({extended:true,limit:'5mb'}));
app.use(bodyParser.json({ type: 'application/json' ,limit: '5mb'}));
app.use('/',express.static(__dirname +'/admin/DBBIM'));//前端页面
app.use('/api',express.static(__dirname +'/api/bim.viewer.api'));//三维引擎api

app.use('/user',require('./routers/user'));//用户模块
app.use('/file',require('./routers/file'));//文件上传
app.use('/model',require('./routers/model'));//模型数据模块
app.use('/bookandtag',require('./routers/bookandtag'));//视角书签模块
app.use('/search',require('./routers/search'));//搜索模块
app.use('/process',require('./routers/process'));//形象进度

app.get('/bimviewer.js',(req,res)=>{
   fs.exists(config.autoSrc,(exist)=>{
       if (exist){
           let data = fs.readFileSync(config.autoSrc);
           res.send(data.toString());
       }else {
           let resdata = {
               code : -1,
               message : '找不到文件'
           };
           res.json(resdata);
       }
   }) ;
});

mongoose.connect(config.mongoURL,{useNewUrlParser : true},function (err) {
   if (err){
       console.log('数据库连接失败，无法启动项目');
   }else {
       let server = app.listen(config.port);
       server.keepAliveTimeout = 60000*3;//设置连接超时
       console.log('BimViewer Listening At Port '+config.port);
   }
});

module.exports = app;
