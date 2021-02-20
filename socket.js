const si = require('systeminformation');
const consolesManager = require("./consolesManager");

exports = module.exports = (io) =>
{
	io.on("connection", connect);
}

connect = (socket) =>
{
	dashboardSocket(socket);
	consoleSocket(socket);
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
