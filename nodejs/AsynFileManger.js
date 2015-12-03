/**
 * Created by yuanfei on 15/12/3.
 */
var filelist={}


var AsynFileManger= function(rootPath){
    this._rootPath = rootPath;
    this._fileList = {};
    this._fileListIndex={};
};


AsynFileManger.prototype.addDir=function(value,isDir)
{
    this._fileListIndex[value] = this._fileList.length;
    var obj= new Object();
    obj.path = value;
    obj.isDir = isDir;
    this._fileList.push(obj);
};


module.exports=AsynFileManger;






