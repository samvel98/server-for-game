const randStr = require('randomstring');
var helpers = require('./helpers.js');


function createEmptyRoom() {
	return {
		id: randStr.generate(),
		users: [],
		isGameStarted: false,
		interval: null,
		startGame(io) {
			if (this.isGameStarted) {
				return false;
			}
			this.isGameStarted = true;
			this.interval = setInterval(() => {
				io.sockets.in(this.id).emit('set_ball_position', helpers.getBallPosition());
			}, 1000);
		},
		stopGame() {
			clearInterval(this.interval);
			this.isGameStarted = false;
		},
		isReady() {
			let ready = true;
			this.users.forEach(user => {
				if (!user.isReady) {
					ready = false;
				}
			});

			return ready && this.users.length === 2;
		},
		getUsersInfo() {
			const users = [];
			this.users.forEach(user => {
				users.push({ ...user, room: null });
			});
			return users;
		},
		removeUser(user) {
			const index = this.users.indexOf(user);
			this.users.splice(index, 1);
		}
	};
}

module.exports = {
	rooms: [createEmptyRoom()],
	users: [],
	findFreeRoom() {
		return this.rooms.find(room => {
			return room.users.length < 2;
		});
	},
	findOrCreateFreeRoom() {
		let freeRoom = this.findFreeRoom();
		if (!freeRoom) {
			freeRoom = createEmptyRoom();
			this.rooms.push(freeRoom);
		}
		return freeRoom;
	},
	joinUserToRoom(user, socket) {
		const freeRoom = this.findOrCreateFreeRoom();
		freeRoom.users.push(user);
		user.room = freeRoom;
		this.users.push(user);
		socket.join(freeRoom.id);
		return freeRoom;
	},
	getUserBySocket(socket) {
		return this.users.find(user => user.socketId === socket.id);
	},
	setUserName(name, socket) {
		const user = this.getUserBySocket(socket);
		if (user) {
			user.name = name;
		}
		return user;
	},
	setUserReady(socket) {
		const user = this.getUserBySocket(socket);
		if (user) {
			user.isReady = true;
		}
		return user;
	},

	removeUserPoint(socket) {
		const user = this.getUserBySocket(socket);
		user.point--;
	}
} 


