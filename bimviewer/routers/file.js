'use strict';
/*create by fenglin on 2019/3/5.
* 文件操作接口
* */
const fs = require('fs'),
     multerFile = require('multer'),
     express = require('express'),
     router = express.Router(),
     currFile = require('../models/File'),
     mongooseClient = require('mongoose'),
     objectId = require('mongodb').ObjectId,
     uuid = require('uuid'),
     path = require('path'),
     utils = require('../tools/utils'),
     config = require('../config/config'),
     MClient = require('mongodb').MongoClient,
     zipper = require('zip-local');

//定义统一返回格式
let responseData;
router.use(function (req, res, next) {
    responseData = {
        code : 0,
        message : String,
        data:[]
    } ;
    next();
});

let uploadDir = config.uploadDir;

fs.exists(uploadDir,function (exists) {
   if (!exists){
       fs.mkdir(uploadDir,function (err) {
            if (err) console.error(err);
            else {
                let geo = path.join(uploadDir,'geometries');
                fs.mkdir(geo,function (err) {

                });
            }
       });
   }
});
let storage = multerFile.diskStorage({
    destination : function (req, file, cb) {
      cb(null,uploadDir);
    },
    filename : function (req, file, cb) {
        cb(null,file.originalname);
    }
});

let upload = multerFile(
   {
       storage : storage,
       limits:{
           fileSize:1024*1024*1024//限制上传文件小于1G
       }
   }
);

let single = upload.single('upfile');
let multi = upload.array('upfile',50);

//文件上传(用于obj类型的上传多个)
router.post('/multiupload',function (req, res) {
    multi(req,res,function (err) {
        if (err instanceof multerFile.MulterError){
            responseData.code=-1;
            responseData.message='上传失败';
            res.json(responseData);
        }else if (err)
            console.error(err);
        else {
            let userid = req.body.userId,filename = req.body.fileName,
                tag = req.body.tag,project = req.body.project,type = req.body.type;
            if (userid == undefined || filename == undefined || tag == undefined  ||
                project == undefined || type == undefined){
                responseData.code=-1;
                responseData.message='参数错误';
                res.json(responseData);
            } else {
                let userdir =path.join(uploadDir,userid);//创建用户单独文件夹
                let dirname = filename.replace('.obj','');//获取obj文件名
                let objpath = path.join(userdir,dirname);
                let imagepath = path.join(objpath,dirname);
                let uniqueid = uuid.v1();
                let modelid = uniqueid;
                let date = utils.getCurrTime();
                let filesize = '0 Kb';
                let deleted = false;
                let status = 1;
                utils.mkdirs(imagepath,()=>{
                    let emptymtl = path.join(objpath,dirname+'.mtl');
                    fs.exists(emptymtl,function (exist) {
                        if (!exist){
                            fs.writeFile(emptymtl,'#MTL=null',()=>{
                            });
                        }
                    }) ;
                    for (let i in req.files){
                        if (req.files.hasOwnProperty(i)){
                            let tfile = req.files[i];
                            if (tfile.originalname.indexOf('.obj') != -1) {
                                filesize = utils.formatFileSize(tfile.size);
                            }
                            let fileType = tfile.originalname.substring(tfile.originalname.lastIndexOf('.')+1).toLowerCase();
                            if (fileType == 'jpg' || fileType == 'png'){
                                let readStream = fs.createReadStream(tfile.path);
                                let writeStream = fs.createWriteStream(path.join(imagepath, tfile.originalname));
                                readStream.pipe(writeStream);
                                writeStream.on('finish', function (file) {
                                    fs.unlink(tfile.path, function (err) {
                                        if (err) console.error(err);
                                    });
                                });
                            }
                            else if (fileType == 'obj') {
                                let readStream = fs.createReadStream(tfile.path);
                                let writeStream = fs.createWriteStream(path.join(objpath,tfile.originalname));
                                readStream.pipe(writeStream);
                                writeStream.on('finish',() => {
                                });
                                fs.unlink(tfile.path,function (err) {
                                    if (err)console.error(err);
                                });
                            }
                            else if(fileType == 'mtl'){
                                let readStream = fs.createReadStream(tfile.path);
                                let writeStream = fs.createWriteStream(path.join(objpath,tfile.originalname));
                                readStream.pipe(writeStream);
                                writeStream.on('finish', function (file) {
                                    fs.unlink(tfile.path, function (err) {
                                        if (err) console.error(err);
                                    });
                                });
                            }

                            if (i == req.files.length-1){
                                let currfile = new currFile({
                                    userId : userid,
                                    modelId : modelid,
                                    date : date,
                                    path : path.join(userid,dirname,filename),
                                    gridId:'null',
                                    tag : tag,
                                    project : project,
                                    type : type,
                                    fileName : filename,
                                    fileType : 'application/octet-stream',
                                    modelType:'obj',
                                    fileSize:filesize,
                                    deleted : deleted,
                                    status : status,
				    addProcess:false
                                });
                                currfile.save()
                                    .then(file=>{
                                        responseData.message='上传成功';
                                        res.json(responseData);
                                    })
                                    .catch(err=>{
                                        console.error(err);
                                        responseData.code=-1;
                                        responseData.message='上传失败';
                                        res.json(responseData);
                                        utils.cleanDir(objpath);
                                    })
                            }
                        }
                        else {
                            responseData.code=-1;
                            responseData.message='上传失败';
                            res.json(responseData);
                        }
                    }
                });
            }
        }
    });
});

//文件上传接口(单文件)
router.post('/singleupload',function (req, res) {
    single(req,res,function (err) {
       if (err instanceof multerFile.MulterError){
           responseData.code=-1;
           responseData.message='上传失败';
           res.json(responseData);
       }else if (err){
           console.error(err);
           responseData.code=-1;
           responseData.message='上传失败';
           res.json(responseData);
       } else {
           let tfile = req.file;
           let userid = req.body.userId;
           let tag = req.body.tag;
           let project = req.body.project;
           let type = req.body.type;
           if (userid == undefined||tag==undefined||project==undefined||type==undefined){
               responseData.code=-1;
               responseData.message='参数错误';
               res.json(responseData);
           }else {
               let modelid = uuid.v1();
               let  date = utils.getCurrTime();
               let filesize = utils.formatFileSize(tfile.size);
               let deleted = false;
               let status = 2;
               let fileType = tfile.originalname.substring(tfile.originalname.lastIndexOf('.')+1).toLowerCase();
               let userdir = path.join(uploadDir,userid);
               let filepath = path.join(userdir,tfile.originalname);
               let file_id;
               let currfile = new currFile({
                   userId : userid,
                   modelId : modelid,
                   date : date,
                   path : path.join(userid,tfile.originalname),
                   gridId:'null',
                   tag : tag,
                   project : project,
                   type : type,
                   fileName : tfile.originalname,
                   fileType : tfile.mimetype,
                   modelType:fileType,
                   fileSize:filesize,
                   deleted : deleted,
                   status : status,
		   addProcess:false
               });
               currfile.save().then(function (file) {
                   file_id = file._id;
                   responseData.message='上传成功';
                   res.json(responseData);
                   utils.mkdirs(userdir,()=>{
                       if(fileType == "rvt" && type == 0){//模型rvt文件保存到gridfs
                           const conn = mongooseClient.createConnection(config.mongoURL,{useNewUrlParser:true});
                           if(conn != undefined){
                               conn.on('open',() => {
                                   const gfs = new mongooseClient.mongo.GridFSBucket(conn.db);
                                   if (gfs){
                                       let readstream = fs.createReadStream(tfile.path);
                                       let fswritestream = fs.createWriteStream(filepath);
                                       readstream.pipe(fswritestream);
                                       fswritestream.on('finish',()=>{
                                           fs.unlink(tfile.path,()=>{
                                               let writestream = gfs.openUploadStream(filepath);
                                               let readstream = fs.createReadStream(filepath);
                                               readstream.pipe(writestream);
                                               writestream.on('error',function (error) {
                                                   console.error(error);
                                               });
                                               writestream.on('finish',function (gridfile) {//写入gridfs成功
                                                   currFile.updateOne({userId:userid,modelId:modelid},{gridId:gridfile._id,fileSize:filesize,
                                                       status:0},function (err) {
                                                       if (err){
                                                           console.error(err);
                                                       } else {

                                                       }
                                                   });
                                               });
                                           });
                                       });
                                   }else {
                                       console.log('can not write to gridfs:{0}',tfile.path );
                                   }
                               });
                           }
                           else console.log('no grid fs !');
                       }
                       else if (fileType == 'ifc' && type == 0) {//ifc模型
                           let readstream = fs.createReadStream(tfile.path);
                           let fswritestream = fs.createWriteStream(filepath);
                           readstream.pipe(fswritestream);
                           fswritestream.on('finish',()=>{
                               fs.unlink(tfile.path,()=>{
                                   currFile.updateOne({userId:userid,modelId:modelid},{fileSize:filesize,status:0}
                                       ,function (err,doc) {
                                           if (err){
                                               console.error(err);
                                           } else {

                                           }
                                       });
                               });
                           });
                       }
                       else if (fileType == 'kbim' && type == 0){
                           let readstream = fs.createReadStream(tfile.path);
                           let fswritestream = fs.createWriteStream(filepath);
                           readstream.pipe(fswritestream);
                           fswritestream.on('finish',()=>{
                               fs.unlink(tfile.path,(err,result)=>{
                                   if (err) console.error(err);
                                   else {
                                       fs.readFile(filepath,(err,data)=>{
                                           if (err)console.error(err);
                                           else {
                                               let obj_data = JSON.parse(data);
                                               let asset = obj_data.Asset;
                                               let tree = obj_data.Tree;
                                               let property = obj_data.Property;
                                               let geometry = obj_data.Geometry;
                                               if (tree){
                                                   let tree_doc =JSON.parse(JSON.stringify(tree).substr(1).substr(0,JSON.stringify(tree).lastIndexOf(']')-1));
                                                   tree_doc.userId = userid;
                                                   tree_doc.modelId = modelid;
                                                   MClient.connect(config.mongoURL,{useNewUrlParser:true},(err,client)=>{
                                                       if (err) console.error(err);
                                                       else {
                                                           let _coll = client.db(config.dataBase).collection(config.treeCollection);
                                                           _coll.insertOne(tree_doc,(err,result)=>{
                                                               if (err) console.error(err);
                                                           });
                                                       }
                                                   });
                                               }
                                               if (property){
                                                   let property_list = [];
                                                   for (let i=0;i<property.length;i++){
                                                       property[i].userId=userid;property[i].modelId=modelid;
                                                       property_list.push(property[i]);
                                                       if (i == property.length-1){
                                                           MClient.connect(config.mongoURL,{useNewUrlParser:true},(err,client)=>{
                                                               if (err) console.error(err);
                                                               else {
                                                                   let _coll = client.db(config.dataBase).collection(config.propertyCollection);
                                                                   _coll.insertMany(property_list,(err,result)=>{
                                                                       if (err)console.error(err);
                                                                   });
                                                               }
                                                           });
                                                       }
                                                   }
                                               }
                                               if (geometry){
                                                   let model_dir = path.join(config.geometryDir,modelid);
                                                   fs.exists(model_dir,function (exist) {
                                                      if (!exist){
                                                          fs.mkdir(model_dir,function (err) {
                                                             if (err)console.error(err);
                                                             else {
                                                                 for (let i=0;i<geometry.length;i++) {
                                                                     let guid = geometry[i].data.guid;
                                                                     let box = geometry[i].data.box;
                                                                     let geo_path = modelid+i+'.json';
                                                                     let geo = {userId:userid,modelId:modelid,version:asset.version,guid:guid,
                                                                         scene:asset.scene,box:box,path:geo_path};
                                                                     utils._insert(config.geometryCollection,geo,function (err, result) {
                                                                         if (err)console.error(err);
                                                                         else {
                                                                         }
                                                                     });
                                                                     fs.writeFileSync(path.join(model_dir,geo_path),JSON.stringify(geometry[i]),function (err) {
                                                                         if (err)console.error(err);
                                                                         else {
                                                                         }
                                                                     });
                                                                     if (i == geometry.length-1){
                                                                         currFile.updateOne({userId:userid,modelId:modelid},
                                                                             {fileSize:filesize,status:1},(err,result)=>{
                                                                                 if (err) console.error(err);
                                                                                 else {

                                                                                 }
                                                                             });
                                                                     }
                                                                 }
                                                             }
                                                          });
                                                      }else {
                                                          for (let i=0;i<geometry.length;i++) {
                                                              let geo_path = modelid+i+'.json';
                                                              let geo = {userId:userid,modelId:modelid,path:geo_path};
                                                              geo_list.push(geo);
                                                              fs.writeFileSync(path.join(model_dir,geo_path),JSON.stringify(geometry[i]),function (err) {
                                                                  if (err)console.error(err);
                                                              });
                                                              if (i == geometry.length-1){
                                                                  utils._insertMany(config.geometryCollection,geo_list,function (err, result) {
                                                                      if (err)console.error(err);
                                                                      else {
                                                                          currFile.updateOne({userId:userid,modelId:modelid},
                                                                              {fileSize:filesize,status:1},(err,result)=>{
                                                                                  if (err) console.error(err);
                                                                                  else {

                                                                                  }
                                                                              });
                                                                      }
                                                                  });
                                                              }
                                                          }
                                                      }
                                                   });
                                               }
                                           }
                                       }) ;
                                   }
                               });

                           });
                       }
                       else {//无需解析的模型
                           let readstream = fs.createReadStream(tfile.path);
                           let fswritestream = fs.createWriteStream(filepath);
                           readstream.pipe(fswritestream);
                           fswritestream.on('finish',()=>{
                               fs.unlink(tfile.path,()=>{
                                   currFile.updateOne({userId:userid,modelId:modelid},{fileSize:filesize,status:1}
                                       ,function (err) {
                                           if (err){
                                               console.error(err);
                                           } else {

                                           }
                                       });
                               });
                           });
                       }
                   });

               }).catch(err=>{
                   console.error(err);
                   responseData.code=-1;
                   responseData.message='上传失败';
                   res.json(responseData);
                   fs.unlink(tfile.path,()=>{});
               });
           }
       }
    });
});

//多模型叠加
router.post('/multimodel',function (req, res) {
   let userid = req.body.userId,
   groupid = req.body.groupId,
   name = req.body.name,
   tag = req.body.tag,
   project = req.body.project,
   type = req.body.type;
   if (userid == undefined || groupid == undefined || name == undefined || tag == undefined
       || project == undefined || type == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   } else {
       let date = utils.getCurrTime();
       let model = new currFile({
           userId:userid,
           groupId:groupid,
           tag:tag,
           project:project,
           type:type,
           fileName:name,
           date:date,
           deleted:false,
           status:1
       });
       model.save().then(model=>{
           responseData.message='多模型保存成功';
           res.json(responseData);
       }
       ).catch(err=>{console.error(err)
           responseData.code=-1;
           responseData.message='多模型保存失败';
           res.json(responseData);
       });
   }
});

//文件下载(单文件)
router.get('/download',function (req, res) {
   let fileid = req.query.fileId;
   if (fileid == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   }
   else {
       currFile.findOne({
           _id: fileid
       }).then(function (fileInfo) {
           if (fileInfo != undefined && Object.keys(fileInfo).length > 0) {
               let download_path = path.join(config.uploadDir,fileInfo.path);
               if (fileInfo.modelType == 'obj'){
                    let objpath = path.dirname(download_path);
                    let objzip = objpath+'.zip';//zip路径
                    zipper.zip(objpath,function (err, zipped) {
                       if (err) console.error(err);
                       else {
                           zipped.compress();
                           zipped.save(objzip,function (err) {
                              if (err) console.error(err);
                              else{
                                  res.download(objzip,function (err) {
                                      if (err) console.error(err);
                                      fs.unlink(objzip,function (err) {
                                          if (err) console.error(err);
                                      });
                                  });
                              }
                           });
                       }
                    });
               }else
                    res.download(download_path,fileInfo.fileName);
           }
           else {
               responseData.code = -1;
               responseData.message = "文件不存在";
               res.json(responseData);
           }
       });
   }
});

//非回收站文件列表接口
router.post('/listfile',function (req, res) {
    let userid = req.body.userId;
    let tag = req.body.tag;//文件项目类型（个人、个人项目、公司项目）
    let project = req.body.project;//所在项目（项目1.2..）
    let type = req.body.type;//文件类型（文件、模型、图片...）
    if (userid == undefined || tag == undefined || project == undefined || type == undefined)
    {
        responseData.code = -1;
        responseData.message = '参数错误';
        res.json(responseData);
    }else {
        currFile.find({userId:userid,tag:tag,project:project,type:type,deleted:false},function (err,docs) {
            if (err) {
                console.error(err);
            }
            if (docs == undefined){
                responseData.code = -1;
                responseData.message = '无文件';
                res.json(responseData);
                return;
            }
            let isEmpty = true;
            for (let i in docs) {
                isEmpty = false;
            }
            if (isEmpty){
                responseData.code = -1;
                responseData.message = "无文件";
                res.json(responseData);
            }else {
                for (let i in docs){
                    let files = {
                        fileId:docs[i]._id,
                        modelId:docs[i].modelId,
                        fileName:docs[i].fileName,
                        fileType:docs[i].fileType,
                        fileSize:docs[i].fileSize,
                        date:docs[i].date,
                        groupId:docs[i].groupId,
			addProcess:docs[i].addProcess
                    };
                    responseData.data.push(files);
                }
                responseData.code=1;
                responseData.message='文件列表';
                res.json(responseData);
            }
        });
    }
});

//回收站文件列表
router.post('/trash',function (req, res) {
   let userid = req.body.userId;
   if (userid == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   }
   else {
       currFile.find({userId:userid,deleted:true},function (err,docs) {
           if(err) console.log(err);
           if (docs == undefined){
               responseData.code = -1;
               responseData.message = '无文件';
               res.json(responseData);
               return;
           }
           let isEmpty = true;
           for (let i in docs)
               isEmpty = false;
           if (isEmpty){
               responseData.code = -1;
               responseData.message = '无文件';
               res.json(responseData);
           } else {
               for (let i in docs){
                   let files = {
                       fileId:docs[i]._id,
                       modelId:docs[i].modelId,
                       fileName:docs[i].fileName,
                       fileType:docs[i].fileType,
                       fileSize:docs[i].fileSize,
                       date:docs[i].date
                   };
                   responseData.data.push(files);
               }
               responseData.code=1;
               responseData.message='查询成功';
               res.json(responseData);
           }
       });
   }
});

//获取用户已上传的所有文件名
router.post('/listfilename',function (req, res) {
   let userid = req.body.userId;
    if (userid == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        let listname = [];
        currFile.find({userId:userid},function (err, docs) {
            if (err)console.log(err);
            if (docs == undefined){
                responseData.code = -1;
                responseData.message = '无文件';
                res.json(responseData);
                return;
            }
            let isEmpty = true;
            for (let i in docs)
                isEmpty = false;
            if (isEmpty){
                responseData.code = -1;
                responseData.message = '无文件';
                res.json(responseData);
            } else {
                for (let i in docs){
                    listname.push(docs[i].fileName);
                }
                res.send(listname);
            }
        });
    }
});

//文件删除(进入回收站)
router.post('/delete',function (req, res) {
    let fileid = req.body.fileId;
    if (fileid == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        currFile.updateOne({_id:fileid},{deleted: true},function (err) {
            if (err) console.log(err);
            responseData.message = "删除成功";
            res.json(responseData);
        });
    }
});

//文件恢复
router.post('/recovery',function (req, res) {
   let fileid = req.body.fileId;
    if (fileid == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        currFile.updateOne({_id : fileid},{deleted : false},function (err) {
            if (err) console.error(err);
            responseData.message = "恢复成功";
            res.json(responseData);
        });
    }
});

//文件销毁（回收站删除）
router.post('/destroy',function (req,res) {
    let fileid = req.body.fileId;
    if (fileid == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    }
    else {
        currFile.findOne({_id:fileid},function (err,fileInfo) {
            if (err)console.log(err);
            else {
                if (fileInfo == undefined){
                    responseData.code = -1;
                    responseData.message = "找不到文件";
                    res.json(responseData);
                    return;
                }
                let arr = Object.keys(fileInfo);
                if (arr.length>0){
                    if (fileInfo.path == undefined){//多模型
                        currFile.deleteOne({_id: objectId(fileid)},function (err) {
                            if (err){
                                responseData.code = -1;
                                responseData.message = "销毁失败";
                                res.json(responseData);
                            }else {
                                responseData.message = "销毁成功";
                                res.json(responseData);
                            }
                        });
                    }else {
                        let realpath = path.join(config.uploadDir,fileInfo.path);//拼接文件路径
                        //删除解析数据的模型，需同时删除解析好的数据
                        if (fileInfo.modelType.toLowerCase() == 'ifc' || fileInfo.modelType == 'rvt'
                            && fileInfo.type == 0 && fileInfo.status == 1){
                            utils.cleanDir(path.join(config.geometryDir,fileInfo.modelId));
                            MClient.connect(config.mongoURL,{useNewUrlParser:true},function (err, client) {
                                if (err) console.error(err);
                                else {
                                    fs.exists(realpath,(exist)=>{
                                        if (exist){
                                            fs.unlink(realpath,function (err) {
                                                if (err) console.error(err);
                                                else {
                                                    let query = {userId:fileInfo.userId,modelId:fileInfo.modelId};
                                                    let geo_collection = client.db(config.dataBase).collection(config.geometryCollection);
                                                    let tree_collection = client.db(config.dataBase).collection(config.treeCollection);
                                                    let property_collection = client.db(config.dataBase).collection(config.propertyCollection);

                                                    geo_collection.deleteMany(query).then((result)=>{
                                                        tree_collection.deleteMany(query).then((result)=>{
                                                            property_collection.deleteMany(query).then((result)=>{
                                                                if (fileInfo.modelType == 'rvt'){//删除gridfs中存储的rvt文件
                                                                    const conn = mongooseClient.createConnection(config.mongoURL,{useNewUrlParser:true});
                                                                    if(conn != undefined){
                                                                        conn.on('open',() => {
                                                                            const gfs = new mongooseClient.mongo.GridFSBucket(conn.db);
                                                                            if (gfs){
                                                                                gfs.delete(objectId(fileInfo.gridId)).then(function (err) {
                                                                                    if (err) console.error(err);
                                                                                    else {
                                                                                        currFile.deleteOne({_id: objectId(fileid)},function (err) {
                                                                                            if (err){
                                                                                                responseData.code = -1;
                                                                                                responseData.message = "销毁失败";
                                                                                                res.json(responseData);
                                                                                            }else {
                                                                                                responseData.message = "销毁成功";
                                                                                                res.json(responseData);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }else {
                                                                                console.log('can not read to gridfs:{0}',tfile.path );
                                                                            }
                                                                        });
                                                                    }
                                                                    else console.log('no grid fs !');
                                                                }
                                                                else {
                                                                    currFile.deleteOne({_id: objectId(fileid)},function (err) {
                                                                        if (err){
                                                                            responseData.code = -1;
                                                                            responseData.message = "销毁失败";
                                                                            res.json(responseData);
                                                                        }else {
                                                                            responseData.message = "销毁成功";
                                                                            res.json(responseData);
                                                                        }
                                                                    });
                                                                }
                                                            }).catch(err=>console.error(err));
                                                        }).catch(err => console.error(err)) ;
                                                    }).catch(err => console.error(err));
                                                }
                                            });
                                        } else {
                                            responseData.code=-1;
                                            responseData.message='文件不存在';
                                            res.json(responseData);
                                        }
                                    });
                                }
                            });
                        }
                        else if (fileInfo.modelType.toLowerCase() == 'kbim' &&
                            fileInfo.type == 0 ){
                            utils.cleanDir(path.join(config.geometryDir,fileInfo.modelId));

                            fs.exists(realpath,(exist)=>{
                                if (exist){
                                    fs.unlink(realpath,err=>{
                                        if (err) console.error(err);
                                    });
                                }
                                currFile.deleteOne({_id: objectId(fileid)},function (err) {
                                    if (err){
                                        responseData.code = -1;
                                        responseData.message = "销毁失败";
                                        res.json(responseData);
                                    }else {
                                        responseData.message = "销毁成功";
                                        res.json(responseData);
                                    }
                                });
                                MClient.connect(config.mongoURL,{useNewUrlParser:true},(err,client)=>{
                                    if (err) console.error(err);
                                    else {
                                        let _db = client.db(config.dataBase);
                                        let _geometry = _db.collection(config.geometryCollection);
                                        let _tree = _db.collection(config.treeCollection);
                                        let _property = _db.collection(config.propertyCollection);
                                        let query = {userId:fileInfo.userId,modelId:fileInfo.modelId};
                                        _geometry.deleteMany(query).then().catch(err=>console.error(err));
                                        _tree.deleteMany(query).then().catch(err=>console.error(err));
                                        _property.deleteMany(query).then().catch(err=>console.error(err));
                                    }
                                });
                            });
                        }
                        else {
                            fs.exists(realpath,(exist)=>{
                                if (exist){
                                    if (fileInfo.modelType.toLowerCase() == 'obj'){
                                        let dir = path.dirname(realpath);
                                        utils.cleanDir(dir);
                                    }
                                    else {
                                        let path = realpath;
                                        fs.unlink(path,function (err) {
                                            if (err) console.error(err);
                                        });
                                    }
                                    currFile.deleteOne({_id: objectId(fileid)},function (err) {
                                        if (err){
                                            responseData.code = -1;
                                            responseData.message = "销毁失败";
                                            res.json(responseData);
                                        }else {
                                            responseData.message = "销毁成功";
                                            res.json(responseData);
                                        }
                                    });
                                }else {
                                    responseData.code=-1;
                                    responseData.message='文件不存在';
                                    res.json(responseData);
                                }
                            });
                        }
                    }
                }
                else {
                    responseData.code = -1;
                    responseData.message = "找不到文件";
                    res.json(responseData);
                }
            }
        });
    }
});

//判断模型是否解析完成
router.post('/status',function (req, res) {
    let userid = req.body.userId;
    let modelid = req.body.modelId;
    if (userid == undefined || modelid == undefined){
        responseData.code=-1;
        responseData.message='参数错误';
        res.json(responseData);
    } else {
        currFile.findOne({userId:userid,modelId:modelid},function (err,fileInfo) {
            if (err) console.error(err);
            else {
                if (fileInfo == undefined)
                {
                    responseData.code=-1;
                    responseData.message='找不到模型';
                    res.json(responseData);
                    return;
                }
                let arr = Object.keys(fileInfo);
                if (arr.length>0){
                    let status = fileInfo.status;
                    if (status == 1){
                        responseData.message = '模型解析完成';
                        res.json(responseData);
                    }else if (status == 0) {
                        responseData.code=-1;
                        responseData.message='模型正在解析中';
                        res.json(responseData);
                    }else if (status == -1) {
                        responseData.code=-1;
                        responseData.message='模型解析失败';
                        res.json(responseData);
                    }else {
                        responseData.code=-1;
                        responseData.message='模型正在解析中';
                        res.json(responseData);
                    }
                }
                else {
                    responseData.code=-1;
                    responseData.message='找不到模型';
                    res.json(responseData);
                }
            }
        });
    }
});

router.post('/search',function (req, res) {
   let userid = req.body.userId,fileid = req.body.fileId;
   if (userid == undefined||fileid == undefined){
       responseData.code=-1;
       responseData.message='参数错误';
       res.json(responseData);
   } else {
       currFile.findOne({_id:objectId(fileid),userId:userid},function (err, result) {
          if (err)console.error(err);
          else {
              if (result){
                  responseData.code=1;
                  responseData.message='单条文件信息';
                  responseData.data.push(result);
                  res.json(responseData);
              }else {
                  responseData.code=-1;
                  responseData.message='找不到文件';
                  res.json(responseData);
              }
          }
       });
   }
});

module.exports = router;
