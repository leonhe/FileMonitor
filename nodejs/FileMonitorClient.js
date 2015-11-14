var net = require('net');
var fs = require("fs")
require("buffer")
var HOST = '192.168.3.79';
var PORT = 6969;

var root_path = "monitor file director path"
var ignoreFile=[".DS_Store"];
var filename="allFile.txt"

var fileWriteStream = fs.createWriteStream('./'+filename,{
  flags: 'w',
  encoding: 'utf8',
  mode: 0777
});


function foreachDir(path)
{
  var file = fs.readdirSync(path)
  file.forEach(function(file){
     // console.log("Foreach:"+path+"/"+file)
     var stat=fs.statSync(path +"/"+ file);
     if(stat.isDirectory()){
         // 如果是文件夹遍历
           var dir_path = path+"/"+file
           // ary.push(dir_path)
           fileWriteStream.write(dir_path+"\n");
           foreachDir(dir_path);
     }else{
         // 读出所有的文件
         if(ignoreFile.indexOf(file)==-1)
         {
           var p_dir = path+"/"+file
           // console.log(path+"/"+file);
           fileWriteStream.write(p_dir+"\n");
         }
     }
   })
}


foreachDir(root_path+"src")
foreachDir(root_path+"res")
// fileWriteStream.close()

// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
net.createServer(function(sock) {
    // 我们获得一个连接 - 该连接自动关联一个socket对象
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // 回发该数据，客户端将收到来自服务端的数据

        fs.readFile("text.txt", function (error, fileData) {
          if(error) throw error;

          console.log(fileData);

          // var buf = [Buffer(fileData.length),Buffer("Heep")];
          // sock.write(fileData.length);
          var len = 128000000//fileData.length
          var buf = new Buffer(32)
          buf.writeInt32LE(String(len),0)
          console.log(buf.readInt32LE())

          sock.write(buf)

          // sock.write(fileData)
          // sock.write();
        });
    });

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
