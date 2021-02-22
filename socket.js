const si = require('systeminformation');
const consolesManager = require("./consolesManager");
const fs = require("fs");

const password = "admin";

exports = module.exports = (io) =>
{
	io.on("connection", connect);
}

connect = (socket) =>
{
	dashboardSocket(socket);
	consoleSocket(socket);
	authentication(socket);
	fileExplorerSocket(socket);
} 

authentication = (socket) =>
{
	socket.on("authen", (passwordSend) =>
	{
		if (password === passwordSend)
		{
			socket.emit("authenReponse", true, "Authentication Sucess");
		}
		else
		{
			socket.emit("authenReponse", false, "incorrect password");
		}
	})
}

dashboardSocket = (socket) =>
{
	socket.on("shutdown", (reboot) =>
	{
		if (reboot)
		{
			console.log("Reboot");
		}
		else
		{
			console.log("Power-off");
		}
	});
	socket.on("get-os-info", () =>
	{
		var info = {};
		si.fullLoad((data) =>
		{
			info.cpuLoad = data;
			si.cpuTemperature((data) =>
			{
				info.cpuTemp = data.main;
				socket.emit("os-info", info);
			})
		})
	});
	
	socket.on("get-os-info-static", () =>
	{
		var info = {};
		si.osInfo((data) =>
		{
			info.os = `${data.distro} ${data.release}`;
			info.host = data.hostname;
			si.system((data) =>
			{
				info.model = data.model;
				socket.emit("os-info-static", info);
			})
		})
	})
}

consoleSocket = (socket) =>
{
	socket.on("consoleInput", (consoleName, input) =>
	{
		consolesManager.WriteConsole(consoleName, input);
	})

	socket.on("exitConsole", (consoleName) =>
	{
		consolesManager.ExitConsole(consoleName);
		setTimeout(() =>
		{
			socket.emit("consoles", consolesManager.GetConsoles());
		}, 1000)
		
	});

	socket.on("newConsole", (consoleName) =>
	{
		consolesManager.NewConsole(consoleName)
		socket.emit("consoles", consolesManager.GetConsoles());
	})

	socket.on("getConsoles", () =>
	{
		socket.emit("consoles", consolesManager.GetConsoles());
		var outputs = consolesManager.GetOutputs()
		for(curConsole in outputs)
		{;
			socket.emit("consoleOutput", outputs[curConsole], curConsole);
		}
	})

	socket.on("getOutput", (consoleName) =>
	{
		socket.emit("consoleOutput", consolesManager.GetOutputs()[consoleName], consoleName);
	})
}

fileExplorerSocket = (socket) =>
{
	socket.on("get-files", (path) =>
	{
		if (!fs.existsSync(path))
		{
			socket.emit("error", "Sorry path does not exist")
		}
		fs.readdir(path, (err, files) =>
		{
			let filesReturn = [];
			if (err) return;
			for(curFile of files)
			{
				if (typeof curFile !== typeof String())
				{
					continue;
				}
				stats = fs.statSync(path + curFile);
				filesReturn.push(
				{
					name: curFile,
					size: stats.size,
					creation: stats.birthtime,
					modified: stats.mtime,
					folder: stats.isDirectory(),
				})
			}
			socket.emit("send-file", filesReturn, path);
		})
		
	})
}