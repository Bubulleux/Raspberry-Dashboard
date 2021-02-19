const express = require("express")
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const pty = require("node-pty");
const fs = require("fs");
const si = require("systeminformation")

const terminals = new Map([
	["Terminal 1", 0],
	["Terminal 2", 0],
	["Terminal 3", 0],
	["Terminal 4", 0],
	["Terminal 5", 0],
])

const page =
{
	"/dashboard": "dashboard.html",
	"/python": "python.html",
	"/console": "console.html",
	"/login": "login.html",
}

app.use(express.static("public"))


app.all("*", (request, reponse, next) =>
{
	//reponse.redirect("/login");
	console.log("Connect: " + request.url);
	next();
})

io.on("connection", (socket) =>
{
// 	var ptyProcess = pty.spawn("bash", [])
// 	ptyProcess.write("cd ~ \r")
	
	// ptyProcess.onData( (data ) =>
	// {
	// 	socket.emit("output", data)
	// })
	
	socket.on("input", (msg) =>
	{
		ptyProcess.write(msg + '\r')
	})

	socket.on("killTerminal", (terminal) =>
	{
		console.log("Kill " + terminal);
		terminals.delete(terminal);
	});

	socket.on("get-os-info", (reponse) =>
	{
		var info = {};
		si.osInfo((data) =>
		{
			info.os = `${data.distro} ${data.release}`
			info.host = data.hostname
		})
	});
})


server.listen(8080, () =>
{
	console.log("Server On");
});

si.cpuCurrentSpeed((data) =>
{
	console.log(data);
})
