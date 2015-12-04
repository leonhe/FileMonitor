var net = require('net');
var fs = require("fs")
var os = require("os")

var Client = require("./lib/Client");
var AsynFileManager = require("./lib/AsynFileManger");



var PORT = 6969;
console.log(os.hostname())
var root_path = "test-file/"
var ignoreFile=[".DS_Store"];
var filename="allFile.txt"

var fileWriteStream =null;

var socket = null;


		fileWriteStream=fs.createWriteStream('./'+filename,{
		  flags: 'w',
		  encoding: 'utf8',
		  mode: 0777
		});


function foreachDir(path,dir,f_list)
{
  var abs_path = path+"/"+dir
  var file = fs.readdirSync((path))

  file.forEach(function(file){
     var stat=fs.statSync(path+"/"+file);
     if(stat.isDirectory()){
         // dir
           var dir_path = path+"/"+file
           var dir_name = dir+"/"+file
           fileWriteStream.write(dir_name+"\n");

         fileListIndex[dir_name]=fileList.length;
            fileList.push({"path":dir_name,"isDir":true});
           foreachDir(dir_path,dir_name);

     }else{
         // all file
         if(ignoreFile.indexOf(file)==-1)
         {
            var p_dir = path+"/"+file
           // console.log(path+"/"+file);
            var file_name = dir+"/"+file
            fileWriteStream.write(file_name+"\n");
             fileListIndex[file_name]=fileList.length;
            fileList.push({"path":file_name,"isDir":false});
         }
     }
   })
}


var file_asyn = new AsynFileManager(root_path);
file_asyn.addWatchDir("src");
file_asyn.addWatchDir("res");
file_asyn.watch();




var clienter = {};
var server=net.createServer(function(sock) {

    var client = new Client(sock,clienter);
    client.init();
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

}).listen(PORT);

console.log('Server listening on :'+ PORT);
