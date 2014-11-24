var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 80;

app.get('/code', function (req, res) {
	res.sendFile(__dirname + '/code.html');
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/img/favicon.ico'));

app.use("/js", express.static(__dirname + '/js'));
app.use("/lib", express.static(__dirname + '/lib'));
app.use("/mode", express.static(__dirname + '/mode'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/fonts", express.static(__dirname + '/fonts'));
app.use("/img", express.static(__dirname + '/img'));
var roomValue = {};
var roomSyntax = {};

io.on('connection', function (socket) {
	var room = void 0;
	socket.on('disconnect', function () {

	});
	socket.on('instruction', function (msg) {
		console.log("room - " + room + " has value - " + msg.roomValue);
		roomValue[room] = msg.roomValue;
		roomSyntax[room] = msg.roomSyntax;
		io.sockets.in(room).emit('instruction', msg);
	});
	socket.on('join', function (msg) {
		if (room != void 0 && msg != void 0 && msg.id != void 0) {
			socket.leave(room);
		}
		room = msg.id;
		socket.join(room);
		var context = {}
		context.origin = "context";
		console.log("sending room - " + room + " value - " + roomValue[room]);
		context.value = roomValue[room];
		context.syntax = roomSyntax[room];
		io.sockets.in(room).emit('instruction', context);
	});
	socket.on('syntax', function (msg) {
		console.log("sending syntax - " + JSON.stringify(msg) + " to room - " + room);
		io.sockets.in(room).emit('syntax', msg);
	});
});

http.listen(port, function () {
	console.log('Server launched on port - ' + port);
});
