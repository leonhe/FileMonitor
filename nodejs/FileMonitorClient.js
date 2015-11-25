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


//need send file buffer data
function readFileBuffer(file_name,file_buffer)
{
   var filename_len=new Buffer(4);
          filename_len.writeInt32LE(String(file_name.length),0)


      var filename=new Buffer(file_name.length);
          filename.write(file_name,0);

      var buf_len = new Buffer(4)
          buf_len.writeInt32LE(String(file_buffer.length),0)
            // console.log("send data length:"+data.length);

      //file name concat buffer
      var send_data=Buffer.concat([filename_len,filename,buf_len,file_buffer],
        file_buffer.length+file_name.length+buf_len.length+filename_len.length)
      return send_data;

}


var fileList=[];

foreachDir(root_path+"/src","src",fileList)
foreachDir(root_path+"/res","res",fileList)

var service ={}
service["2000"] = function(data)
{
          if(data!="hello") return;
	      // console.log(data);
	        var buf=new Buffer(filename.length)
	        buf.write(filename,0)
	        console.log(buf.toString())
	        sendData(socket,1000,buf);

	        var data=fs.readFileSync("./"+filename);
	        console.log(data)
	        sendData(socket,1001,data)

          //watch src director change file
          fs.watch(root_path+"/src",function(event,filename){
              console.log("event:"+event+" filename:"+filename)
              if(event=="change")
              {
                service["2002"]("src/"+filename);
              }
          })


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


var server=net.createServer(function(sock) {
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

});


    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT);

console.log('Server listening on :'+ PORT);
