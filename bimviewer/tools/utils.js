'use strict';
/*工具类*/
const fs = require('fs'), path = require('path'),
    mongo = require('mongodb').MongoClient,
    crypto = require('crypto'),
    config = require('../config/config');

//删除文件夹（包含子文件）
function cleanDir(dir) {
    if (fs.existsSync(dir)){
        let files = fs.readdirSync(dir);
        files.forEach(function (file) {
            let currDir = path.join(dir,file);
            if (fs.statSync(currDir).isDirectory()){
                cleanDir(currDir);
            }
            else {
                fs.unlinkSync(currDir,function (err) {
                    if (err)console.log(err);
                });
            }
        });
        fs.rmdirSync(dir);
    }
}

//获取当前时间
function getCurrTime(){
    let d = new Date();
    let year = d.getFullYear().toString();
    let month = (d.getMonth()+1).toString();
    let day = d.getDate().toString();
    let hour = d.getHours().toString();
    let minute = d.getMinutes().toString().length>1?d.getMinutes().toString():'0'+d.getMinutes().toString();
    let  date = year+'-'+month+'-'+day+' '+hour+':'+minute;
    return date;
}

//格式化文件大小
function formatFileSize(size){
    let filesize;
    if (size > 1024*1024){//大于1M
        let size_str = (size/1024/1024).toString();
        filesize = size_str.substring(0,size_str.lastIndexOf('.')+2)+' Mb';
    }else {
        filesize = Math.round(size/1024)+' Kb';
    }
    return filesize;
}

//递归创建文件夹
function mkdirs(dirname, callback){
    fs.exists(dirname, function (exists){
        if(exists){
            callback();
        }else{
            mkdirs(path.dirname(dirname), function (){
                fs.mkdir(dirname, callback);
            });
        }
    });
}

//AES加密
function encryption(data) {
    var iv = "";
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var cipherChunks = [];
    var cipher = CRYPTO.createCipheriv('aes-128-ecb', key, iv);
    cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');
}

//AES解密
function decryption(data,key,iv){
    let clearEncoding = 'utf8';
    let cipherEncoding = 'base64';
    let cipherChunks = [];
    let decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
    decipher.setAutoPadding(true);
    cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));
    return cipherChunks.join('');
}

function _connDB(url,db,cb){
       mongo.connect(url,{useNewUrlParser:true},function (err,client) {
           if (err)
               console.error(err);
           else
               cb(client.db(db));
       }) ;
}

function _insert(_coll,doc,cb) {
    _connDB(config.mongoURL,config.dataBase,function (db) {
        db.collection(_coll).insertOne(doc,(err,result)=>{
            cb(err,result);
        });
    });
}

function _insertMany(_coll,docs,cb) {
    _connDB(config.mongoURL,config.dataBase,function (db) {
       db.collection(_coll).insertMany(docs,(err,result)=>{
           cb(err,result);
       }) ;
    });
}

function findOne(collection,query,callback){
    _connDB(config.mongoURL,function (err, db) {
       db.collection(collection).find(query,function (err,result) {
           callback(err,result);
           db.close();
       }) ;
    });
}

function find(collection,query,callback){
    _connDB(config.mongoURL,function (err, db) {
        db.collection(collection).find(query,function (err,result) {
            callback(err,result);
            db.close();
        }) ;
    });
}

function updateOne(collection,query,update,callback){
    _connDB(config.mongoURL,function (err, db) {
       db.collection(collection).updateOne(query,update,function (err, result) {
           callback(err,result);
           db.close();
       }) ;
    });
}

function deleteMany(collection,query,callback){
    _connDB(config.mongoURL,function (err, db) {
       db.collection(collection).deleteMany(query,function (err, result) {
           callback(err,result);
           db.close();
       }) ;
    });
}

module.exports = {
    cleanDir,
    getCurrTime,
    formatFileSize,
    mkdirs,
    find,
    findOne,
    deleteMany,
    updateOne,
    _insert,
    _insertMany,
    encryption,
    decryption
};
