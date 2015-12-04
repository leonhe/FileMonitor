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

 function sendData(sock,command_value,data)
{
            var command = new Buffer(4)
            command.writeInt32LE(String(command_value),0)
            console.log(command.readInt32LE())

            var buf = new Buffer(4)
            buf.writeInt32LE(String(data.length),0)
            console.log(buf.readInt32LE())

            sock.write(command)
            sock.write(buf)
            sock.write(data,0,data.length,"binary")
}






var service ={};
var watch_list = [];

var fileList=[
             {path:"src",isDir:true},
             {path:"res",isDir:true}
];
var fileListIndex={src:0,res:1};

//for(var i=0;i<2;++i)
//{
//    var dir_name = fileList[i].path;
//    foreachDir(root_path+"/"+dir_name,dir_name,fileList)
//
//    chokidar.watch(root_path+"/"+dir_name, {ignored: /[\/\\]\./}).on('all', function(event, path) {
//        console.log(event, path);
//
//    });
//}


var file_asyn = new AsynFileManager(root_path);
file_asyn.addWatchDir("src");
file_asyn.addWatchDir("res");
file_asyn.watch();


service["2000"] = function(data)
{
          if(data!="hello") return;
	      // console.log(data);
	        var buf=new Buffer(filename.length)
	        buf.write(filename,0)

	       sendData(socket,1000,buf);

           var data=JSON.stringify(fileList);
           sendData(socket,1001,data)


        //watch src director change file
        for(var i=0;i<fileList.length;++i)
        {
            var file_data = fileList[i];
            if(file_data.isDir)
            {
                var watcher = new Object();
                var dir_path = file_data.path;
                watcher.path =dir_path;
                watcher.start= function(){
                    var dir_path_ = this.path;
                    //fs.watch(root_path+dir_path_,function(event,filename){
                    //    console.log("event:"+event+" filename:"+filename)
                    //    //file path
                    //    var file_p =dir_path_+"/"+filename;
                    //    if(event=="change")
                    //    {
                    //
                    //        console.log("update file:"+file_p);
                    //        service["2002"](file_p);
                    //    }
                    //    if(event=="rename")
                    //    {
                    //       if(fileListIndex[file_p])
                    //       {
                    //           //delete file
                    //           service["2003"](file_p);
                    //           //fileListIndex[file_p]=null;
                    //           delete fileListIndex[file_p];
                    //           console.log("delete file"+file_p);
                    //       }else{
                    //           //create file
                    //           console.log("create file");
                    //           service["2002"](file_p);
                    //           fileListIndex[file_p] = true;
                    //       }
                    //    }
                    //
                    //})

                }
                watcher.start();
                watch_list.push(watcher);
            }
        }



}

//recvie file
service["2002"] = function(value)
{
    var filepath = (root_path+value).toString()

    var data=fs.readFile(filepath,function(erro,data){
          if(erro) throw erro;

      var send_data = readFileBuffer(value,data)
      sendData(socket,1002,send_data);

    });


}
//delete file
service["2003"] = function(value)
{
    var  send_data = new Object();
    send_data.file = value;
    var del_data=JSON.stringify(send_data);
    sendData(socket,1003,del_data);
}

var clienter = {};
var server=net.createServer(function(sock) {

    var client = new Client(sock,clienter);
    client.init();
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

}).listen(PORT);

console.log('Server listening on :'+ PORT);
