/**
 * Created by yuanfei on 15/12/3.
 */
var fs = require("fs")
var ServicesDecode = function(client)
{
    this.client = client;
}

var command_list = new Object();



ServicesDecode.prototype.decode=function(cmd,data)
{
    var self = this;
    if(command_list[cmd]==null) return null;
    command_list[cmd].call(self,data)
}


command_list["2000"] = function(fileList)
{
    var data=JSON.stringify(fileList);
    this.client.sendData(1000,data)
}

//recvie file
command_list["2001"] = function(value)
{
    var filepath = (value).toString()
    var thiz = this;
    var data=fs.readFile(filepath,function(erro,data){
        if(erro) throw erro;
        var send_data = thiz.client.readFileBuffer(value,data)
        thiz.client.sendData(1002,send_data);

    });

}
//delete file
command_list["2002"] = function(value)
{
    var  send_data = new Object();
    send_data.file = value;
    var del_data=JSON.stringify(send_data);
    this.client.sendData(1003,del_data);
}





module.exports = ServicesDecode;