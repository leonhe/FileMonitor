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

Client.prototype.data = function(value)
{

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