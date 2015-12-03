/**
 * Created by yuanfei on 15/12/3.
 */
var Client=function(service)
{
    this._sokt =service;
}

Client.prototype.getKey=function()
{
    return (this._sokt.remoteAddress+":"+this._sokt.remotePort).toString();
}
module.exports = Client;