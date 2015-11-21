var net = require('net');
var fs = require("fs")

var HOST = '192.168.1.66'; //获取本机ip地址
var PORT = 6969;

var root_path = "../../SPYOnline/"
var ignoreFile=[".DS_Store"];
var filename="allFile.txt"

var fileWriteStream = fs.createWriteStream('./'+filename,{
  flags: 'w',
  encoding: 'utf8',
  mode: 0777
});

var socket = null;

//TODO fs.watch检测改变的文件
//TODO 初始化上传文件列表文件到客户端
//TODO 匹配文件列表中文件是否有改动然后进行更新文件


function foreachDir(path,dir)
{
  // console.log(path+"/"+dir)
  var abs_path = path+"/"+dir
  var file = fs.readdirSync((path))

  file.forEach(function(file){
     // console.log("Foreach:"+path+"/"+file)
    //  var sub_path = dir+"/"+file
     var stat=fs.statSync(path+"/"+file);
     if(stat.isDirectory()){
         // 如果是文件夹遍历
           var dir_path = path+"/"+file
           var dir_name = dir+"/"+file
           fileWriteStream.write(dir_name+"\n");
           foreachDir(dir_path,dir_name);

     }else{
         // 读出所有的文件
         if(ignoreFile.indexOf(file)==-1)
         {
           var p_dir = path+"/"+file
           // console.log(path+"/"+file);
           var file_name = dir+"/"+file
           fileWriteStream.write(file_name+"\n");
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
            sock.write(data)
}




var service ={}
service["2000"] = function(data)
{

  foreachDir(root_path+"/src","src")
  foreachDir(root_path+"/res","res")

      console.log(data);
        var buf=new Buffer(filename.length)
        buf.write(filename,0)
        console.log(buf.toString())
        sendData(socket,1000,buf);

        fs.readFile("./"+filename, function (error, fileData) {
          if(error) throw error;
          //发送文件列表文件的数据
          sendData(socket,1001,fileData);
        });
}
//接收到获取单个文件的处理
service["2002"] = function(data)
{
  console.log(data+"\n");
  fs.readFile(root_path+filename, function (error, fileData) {
    if(error) throw error;
      //发送文件的数据
      // sendData(socket,1002,fileData);
  });
}


// fileWriteStream.close()


// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
net.createServer(function(sock) {
    // 我们获得一个连接 - 该连接自动关联一个socket对象
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);
    socket = sock;

    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
        // console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // 回发该数据，客户端将收到来自服务端的数据
        //发送同步文件列表
        var reciv_data = data.toString()
        var command=reciv_data.substr(0,4)
        var data = reciv_data.substr(4,reciv_data.length)
        var fun = service[command];
        if(fun){
            fun(data);
        }

        // console.log("command:"+command+"   data:"+data)

});

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT);

console.log('Server listening on ' + HOST +':'+ PORT);
