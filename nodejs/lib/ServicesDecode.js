/**
 * Created by yuanfei on 15/12/3.
 */
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


command_list["2000"] = function(data)
{
    if(data!="hello") return;
    // console.log(data);
    var buf=new Buffer(filename.length)
    buf.write(filename,0)

    this.client.sendData(1000,buf);

    var data=JSON.stringify(fileList);
    this.client.sendData(1001,data)
}

//recvie file
command_list["2002"] = function(value)
{
    var filepath = (root_path+value).toString()

    var data=fs.readFile(filepath,function(erro,data){
        if(erro) throw erro;
        var send_data = readFileBuffer(value,data)
        this.client.sendData(1002,send_data);

    });

}
//delete file
command_list["2003"] = function(value)
{
    var  send_data = new Object();
    send_data.file = value;
    var del_data=JSON.stringify(send_data);
    this.client.sendData(1003,del_data);
}





module.exports = ServicesDecode;