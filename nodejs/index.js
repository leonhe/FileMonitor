var net = require('net');
var fs = require("fs")
var os = require("os")

var Client = require("./lib/Client");
var AsynFileManager = require("./lib/AsynFileManger");


var PORT = 6969;
console.log(os.hostname())
//watch directory
var root_path = "test-file/"

var file_asyn = new AsynFileManager(root_path);
file_asyn.watch();


var clienter = {};
var server=net.createServer(function(sock) {

    var client = new Client(sock,clienter);
    client.init();
    file_asyn.addObserver(client);
    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

}).listen(PORT);

console.log('Server listening on :'+ PORT);
