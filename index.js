var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var helpers = require('./helpers.js');
var roomController = require('./rooms-controller.js');
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var online = 0;
io.on('connection', function(socket){
	const user = {
		name: '',
		point: 0,
		socketId: socket.id,
		isReady: false,
		roomId: null
	};


	roomController.joinUserToRoom(user, socket);

	setTimeout(() => {
		io.sockets.in(user.room.id).emit('users_info', user.room.getUsersInfo());
	}, 1000);


	socket.on('set_name', function(name) {
		roomController.setUserName(name, socket);
	});

	socket.on('user_ready', function() {
		const user = roomController.setUserReady(socket);

		if (user.room.isReady()) {
			user.room.startGame(io);
		}
	});

	socket.on('add_point', function(){
		io.sockets.in(user.room.id).emit('click_ball', ++user.point, user.socketId);
	})

	io.emit('online_now', ++online);

	socket.on('disconnect', function(){
		io.emit('online_now', --online);
		const user = roomController.getUserBySocket(socket);
		user.room.stopGame();
		user.room.removeUser(user);
	})
	socket.on('end_game', function(){
		user.room.stopGame();
	})
});



http.listen(3000, function(){
  console.log('listening on *:3000');
});




