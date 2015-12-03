/**
 * Created by yuanfei on 15/12/3.
 */
var Client=function(service,client_list)
{
    this._sokt =service;
    this._clientList = client_list;
    this._clientList[this.getKey()] = this;
    this._key =(this._sokt.remoteAddress+":"+this._sokt.remotePort).toString()
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



Client.prototype.getKey=function()
{
    return this._key;
}

//client data handler
Client.prototype.data = function(value)
{
    if(data.toString()=="close")
    {
        this._sokt.close();
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
}


Client.prototype.close = function(data)
{
    var key = this.getKey();
    this._clientList[key] = null;
    delete this._clientList[key];
    console.log('CLOSED: ' +
        this._sokt.remoteAddress + ' ' + this._sokt.remotePort);
}


module.exports = Client;