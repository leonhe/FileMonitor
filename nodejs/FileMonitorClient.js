var net = require('net');
var fs = require("fs")
var os = require("os")
var PORT = 6969;
console.log(os.hostname())
var root_path = "test-file/"
var ignoreFile=[".DS_Store"];
var filename="allFile.txt"

var fileWriteStream =null;

var socket = null;

//TODO fs.watch检测改变的文件
//TODO 匹配文件列表中文件是否有改动然后进行更新文件

		fileWriteStream=fs.createWriteStream('./'+filename,{
		  flags: 'w',
		  encoding: 'utf8',
		  mode: 0777
		});


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
            sock.write(data,0,data.length,"binary")
}



// foreachDir(root_path+"/src","src")
foreachDir(root_path+"/res","res")

var service ={}
service["2000"] = function(data)
{
  
	      // console.log(data);
	        var buf=new Buffer(filename.length)
	        buf.write(filename,0)
	        console.log(buf.toString())
	        sendData(socket,1000,buf);

	        var data=fs.readFileSync("./"+filename);
	        console.log(data)
	        sendData(socket,1001,data)

  
}
//接收到获取单个文件的处理
service["2002"] = function(value)
{
  console.log(value+"\n");
    var filepath = (root_path+value).toString()

    var rOption = {
              flags : 'r',
              encoding : null,
              mode : 0666
    }

    var fileReadStream = fs.createReadStream(filepath,rOption);
    fileReadStream.on('data',function(data){
          // fileWriteStream.write(data);
          var filename_len=new Buffer(4);
          filename_len.writeInt32LE(String(value.length),0)


          var filename=new Buffer(value.length);
          filename.write(value,0);

            var buf_len = new Buffer(4)
            buf_len.writeInt32LE(String(data.length),0)
            console.log("send data length:"+data.length);

      //file name concat buffer
      var send_data=Buffer.concat([filename_len,filename,buf_len,data],
        data.length+value.length+buf_len.length+filename_len.length)

      console.log("file data length: ",data.length);

      //发送文件的数据w
      sendData(socket,1002,send_data);

      this.close();
});

}


// fileWriteStream.close()


// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
var server=net.createServer(function(sock) {
    // 我们获得一个连接 - 该连接自动关联一个socket对象
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);
    socket = sock;

    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
      
        if(data.toString()=="close")
        {
          server.close();
          return;
        }
        // console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // 回发该数据，客户端将收到来自服务端的数据
        //发送同步文件列表
        var offset_val = 0;
        var recvie_data=[]
      while(offset_val<data.length){

        var data_len = parseInt((data.slice(offset_val,offset_val+9)).toString("utf8"));
        var jsonstr = (data.slice(offset_val+9,offset_val+data_len+9)).toString("utf8");

        var json=JSON.parse(jsonstr);
        recvie_data.push(json);
        offset_val+=(data_len+9);
      }

        recvie_data.forEach(function(value){

            var command=value.command;
            var data = value.data;
            var fun = service[command];
            if(fun){
                fun(data);
            }
        });
        //
        // console.log("command:"+command+"   data:"+data)

});

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT);

console.log('Server listening on :'+ PORT);
