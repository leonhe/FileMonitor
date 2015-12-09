/**
 * Created by yuanfei on 15/12/3.
 */


var ServicesDecode = require("./ServicesDecode")

var Client=function(service,client_list)
{
    this._sokt =service;
    this.services = new ServicesDecode(this)
    this._clientList = client_list;
    this._clientList[this.getKey()] = this;
    this._key =(this._sokt.remoteAddress+":"+this._sokt.remotePort).toString()
}

Client.prototype.getServices=function()
{
    return this.services;
}

Client.prototype.init = function()
{
    var self = this;
    this._sokt.on("data",
        function(data){
            self.data.call(self,data);
        });
    this._sokt.on("close",function(data){
        self.close(self,data);
    });
}

Client.prototype.sendFileList = function(files)
{
    this.services.decode(2000,files);
}



Client.prototype.getKey=function()
{
    return this._key;
}

//client data handler
Client.prototype.data = function(value)
{
    if(value.toString()=="close")
    {
        this._sokt.close();
        return;
    }


      var offset_val = 0;
      var recvie_data=[]
    while(offset_val<value.length){

      var data_len = parseInt((value.slice(offset_val,offset_val+9)).toString("utf8"));
      var jsonstr = (value.slice(offset_val+9,offset_val+data_len+9)).toString("utf8");

      var json=JSON.parse(jsonstr);
      recvie_data.push(json);
      offset_val+=(data_len+9);
    }
        var self= this;
      recvie_data.forEach(function(value){

          var command=value.command;
          var data = (value.data).toString();
         self.services.decode(command,data);
      });
}


Client.prototype.close = function(data)
{
    var key = this.getKey();
    this._clientList[key] = null;
    delete this._clientList[key];
    console.log('CLOSED: ' +
        this._sokt.remoteAddress + ' ' + this._sokt.remotePort);
}

//need send file buffer data
Client.prototype.readFileBuffer=function(file_name,file_buffer)
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
//send data
Client.prototype.sendData=function(command_value,data)
{
    var command = new Buffer(4)
    command.writeInt32LE(String(command_value),0)
    console.log(command.readInt32LE())

    var buf = new Buffer(4)
    buf.writeInt32LE(String(data.length),0)
    console.log(buf.readInt32LE())

    this._sokt.write(command)
    this._sokt.write(buf)
    this._sokt.write(data,0,data.length,"binary")
}



Client.prototype.update = function(data)
{

}

module.exports = Client;