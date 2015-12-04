/**
 * Created by yuanfei on 15/12/3.
 */
var chokidar = require('chokidar');


var AsynFileManger= function(rootPath){
    this._rootPath = rootPath;
    this._fileList = [];
    this._fileListIndex={};
    this._watchDirList = [];



};

AsynFileManger.prototype.deleteFileList= function (value) {
        var index = this._fileListIndex[value];
        if(index<0) return;
        this._fileList.splice(index,1);
        this._fileListIndex[value]=-1;
        delete this._fileListIndex[value]
}

AsynFileManger.prototype.addWatchDir=function(value)
{
   this._watchDirList.push(value);
};

//add directory
AsynFileManger.prototype.addDir=function(value)
{
    var root = this._rootPath;
    this._fileListIndex[value] = this._fileList.length;
    this._fileList.push({path:value,isDir:true});
}
//add file
AsynFileManger.prototype.add=function(value)
{
    this._fileListIndex[value] = this._fileList.length;
    this._fileList.push({path:value,isDir:false});
}
//delete
AsynFileManger.prototype.unlink=function(value)
{
    this.deleteFileList(value);

}
//update file
AsynFileManger.prototype.change = function(value)
{

}
//delete directory
AsynFileManger.prototype.unlinkDir=function(value)
{
    this.deleteFileList(value);
}

AsynFileManger.prototype.watch = function()
{
    var self = this;
    this._watchDirList.forEach(function(value){

        chokidar.watch(self._rootPath, {ignored: /[\/\\]\./}).on('all', function(event, path) {
            console.log(event, path);
            var act = self[event];
            if(act)
            {
                act.call(self,path);
            }
        })

    });

}

module.exports=AsynFileManger;






