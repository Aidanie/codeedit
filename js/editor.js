var username = void 0;

//var socket = io();

var host = window.location.hostname;

var manager = io.Manager('http://'+host+':80', { /* options */ });
manager.on('connect_error', function() {
    console.log("Connection error, eventually this will be handled with a dialog");
});

manager.on('disconnect', function() {
    console.log("Connection error, eventually this will be handled with a dialog");
});

var socket = io.connect('http://'+host+':80');

function getId() {
	var split = document.URL.split("?");
	if (split.length == 1) {
		var id = Math.random().toString(36).substring(7)
			window.location.href = "?" + id;
	}
	return split[1].replace("#", "");
}

socket.emit('join', {
	id : getId()
});

var code = function () {

	var userColor = {}
	var colors = ['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 'lime', 'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 'teal']
	var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
			lineNumbers : true,
			showCursorWhenSelecting : true,
			lineWrapping : true

		});
	var changeQueue = new Array();
	var lastline = void 0;
	var lastChange = new Date();
	var flushTime = 200;

	editor.on("change", function (cm, change) {
		if (change.origin != undefined) {
			change.username = username;
			sendChange(change);
			var coords = cm.cursorCoords();
			$(document.body).append(getCursorObject(username, cm, coords));
			lastChange = new Date();
		}
	});

	socket.on('instruction', function (msg) {
		if (msg.username != username) {
			if (msg.origin == "+input" || msg.origin == "paste") {
				insertText(msg.text, msg.from, msg.to, msg.username);
			} else if (msg.origin == "+delete") {
				removeText(msg.from, msg.to, msg.username)
			} else if (msg.origin == "context") {
				if (editor.getValue() != msg.roomValue) {
					if (msg.value != void 0) {
						editor.setValue(msg.value);
					}
					if (msg.syntax != void 0) {
						editor.setOption('mode', {
							name : msg.syntax
						});
					}
				}
			}
		}
	});

	var interval = setInterval(function () {
			flushQueue()
		}, flushTime);

	function flushQueue() {
		if ((new Date().getTime() - lastChange.getTime()) > flushTime) {
			while (changeQueue.length > 0) {
				socket.emit('instruction', changeQueue.shift());
			}
		}
	}

	function sendChange(change) {
		//changeQueue.enqueue(change);
		var thisLine = change.from.line;
		var text = change.text[0];
		if (text == " " || text == "\n" || text == "") {
			while (changeQueue.length > 0) {
				socket.emit('instruction', changeQueue.shift());
			}
		}
		change.roomValue = editor.getValue();
		change.roomSyntax = editor.getMode().name;
		changeQueue.push(change);
	}

	function insertText(text, from, to, username) {
		editor.replaceRange(text, from, to)
		var coords = editor.charCoords(from);
		$(document.body).append(getCursorObject(username, editor, coords));
	}

	function removeText(from, to, username) {
		editor.replaceRange("", from, to);
		var coords = editor.charCoords(from);
		$(document.body).append(getCursorObject(username, editor, coords));
	}

	function getCursorObject(username, cm, coords) {
		$('#' + username + 'cursor').remove();
		var cursor = $('<p id="' + username + 'cursor"> ' + username + '</p>').css({
				color : getUserColor(username),
				top : coords.top,
				left : coords.left,
				right : coords.right,
				bottom : coords.bottom,
				position : 'absolute'
			}).delay(750).fadeOut();
		return cursor;
	}

	function getUserColor(username) {
		if (userColor[username] == void 0) {
			userColor[username] = colors[Math.abs(username.hashCode() % colors.length)];
		}
		return userColor[username];
	}

	this.setSyntax = function (syntax) {
		editor.setOption('mode', {
			name : syntax
		});
	}

	this.getEditor = function () {
		return editor;
	}
};
var access = new code();

function changeSyntax(id, value, emit) {
	access.setSyntax(id);
	var title = $('#' + id).text();
	$('#syntaxdropdown').text(title);
	if (emit != void 0 && emit) {
		socket.emit('syntax', {
			name : id,
			user : username
		});
	}
}

socket.on('syntax', function (msg) {
	var id = msg.name;
	if (msg.user != username) {
		changeSyntax(id, "", false);
	}
});

String.prototype.hashCode = function () {
	var hash = 0,
	i,
	chr,
	len;
	if (this.length == 0)
		return hash;
	for (i = 0, len = this.length; i < len; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

$(document).ready(function () {

	if (localStorage.getItem('username') != void 0) {
		username = localStorage.getItem('username');
		$('#nametag').text(username);
	}
	//Setup listeners
	$("#submit").on("click", function (e) {
		e.preventDefault();
		username = $('#name').val();
		$('#nametag').text(username);
		if (username != undefined && username != "") {
			localStorage.setItem('username', username);
		}
	});
	//Launch modal
	setUserName(false);
});

function setUserName(force) {
	if (localStorage.getItem('username') == void 0 || force) {
		$('#getName').modal({
			show : true,
			backdrop : true
		});
	}
}
