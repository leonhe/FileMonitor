var net = require('net');
var client = net.connect({port: 6969},
    function() { //'connect' listener
  console.log('connected to server!');
  // client.write('world!\r\n');
  client.write('close');
  client.end();
});
client.on('data', function(data) {
  // console.log(data.toString());
  // client.end();
});
client.on('end', function() {
  console.log('disconnected from server');
});
