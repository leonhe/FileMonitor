/**
 * Created by yuanfei on 15/12/3.
 */
var chokidar = require('chokidar');


var AsynFileManger= function(rootPath){
    this._rootPath = rootPath;
    this._fileList = [];
    this._fileListIndex={};
    this._observer = [];
    this._observerIndex = {};

};

AsynFileManger.prototype.deleteFileList= function (value) {
        var index = this._fileListIndex[value];
        if(index<0) return;
        this._fileList.splice(index,1);
        this._fileListIndex[value]=-1;
        delete this._fileListIndex[value]
}

AsynFileManger.prototype.addObserver=function(value)
{
    this._observerIndex[value.getKey()] = this._observer.length;
   this._observer.push(value);
};

AsynFileManger.prototype.hasObserver = function(key)
{
    return this._observerIndex[key]!=null;
}

AsynFileManger.prototype.removeObserver = function(value)
{
    var key = value.getKey()
    var index = this._observerIndex[key]
    if(index<0) return;
    this._observer.splice(index,1);
    this._observerIndex[key]=-1;
    delete this._observerIndex[key];
}

AsynFileManger.prototype.update=function(data)
{
    this._observer.forEach(function(client){
        client.update(data);
    });
}

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

        chokidar.watch(self._rootPath, {ignored: /[\/\\]\./}).on('all', function(event, path) {
            console.log(event, path);
            var act = self[event];
            if(act)
            {
                act.call(self,path);
            }
        });

}

module.exports=AsynFileManger;






