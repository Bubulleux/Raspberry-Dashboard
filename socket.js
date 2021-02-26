const si = require('systeminformation');
const consolesManager = require("./consolesManager");
const fs = require("fs-extra");
const compressing = require("compressing");
const pathJs = require("path");
const settings = require("./setting");

const password = "admin";

const uploadStream = {}
var uploadBusy = false;

exports = module.exports = (io) =>
{
	io.on("connection", connect);
}

connect = (socket) =>
{
	dashboardSocket(socket);
	consoleSocket(socket);
	fileExplorerSocket(socket);
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
	let sendShortcut = () =>
	{
		const shortcut = settings.getSetting("shortcut");
		socket.emit("send-shortcut", shortcut);
	}

	socket.on("get-shortcut", sendShortcut)

	socket.on("add-shortcut", (shortcutAdd) =>
	{
		let shortcuts = settings.getSetting("shortcut");
		shortcuts.push(shortcutAdd);
		settings.setSetting("shortcut", shortcuts);
		sendShortcut();
	})

	socket.on("remove-shortcut", (shortcutRemove) =>
	{
		let shortcuts = settings.getSetting("shortcut");
		shortcuts.splice(shortcuts.indexOf(shortcutRemove), 1);
		settings.setSetting("shortcut", shortcuts);
		sendShortcut();
	});

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

	socket.on("download", (path, file) =>
	{
		fs.copy(path + file, __dirname + "/public/tmp/" + file, (err) =>
		{
			compressing.zip.compressDir(__dirname + "/public/tmp/" + file, __dirname + "/public/tmp/" + file + ".tar")
			.then((err) =>
			{
				socket.emit("open", "/tmp/" + file + ".tar");
			})
		})
	})

	socket.on("delete", (file) =>
	{
		fs.remove(file, (err) =>
		{
			socket.emit("refresh");
		});
	})

	socket.on("rename", (path, file, newName) =>
	{
		fs.rename(path + file, path + newName, () =>
		{
			console.log("rename");
			socket.emit("refresh");
		});
	})

	socket.on("mkdir", (path, folderName) =>
	{
		fs.mkdir(path + folderName, (error) =>
		{
			if (error)
			{
				socket.emit("error", "Make folder Error")
			}
			socket.emit("refresh");
		})
	})

	socket.on("copy", (pathSource, pathDestination, file, cut) =>
	{
		fs.copy(pathSource + file, pathDestination + file, (err) =>
		{
			if (err) console.log(err);
			let finish = () =>
			{
				console.log(`Copy finish Source: ${pathSource + file}, Destination: ${pathDestination}, Cut: ${cut}`);
				socket.emit("refresh");
			}
			if (cut)
			{
				fs.remove(pathSource + file, (err) =>
				{
					finish();
				});
			}
			else
			{
				finish();
			}
		})
	});

	socket.on("upload-declare", (fileName) =>
	{
		console.log("upload-declare " + fileName);
		let path = "./public/tmp/" + pathJs.dirname(fileName);
		if (!fs.existsSync(path))
		{
			fs.mkdir(path);
		}
		uploadStream[fileName] = {};
	})

	socket.on("upload-start", (fileName) =>
	{
		console.log("upload-start " + fileName);
		
		uploadStream[fileName].writer = fs.createWriteStream("./public/tmp/" + fileName);
		uploadBusy = true;
	})

	socket.on("upload", (fileName, packet) =>
	{
		var buffer = Buffer.from(packet);
		uploadStream[fileName].writer.write(buffer);
	})

	socket.on("upload-end", (fileName, path) =>
	{
		uploadStream[fileName].writer.end();
		fs.copy(__dirname + "/public/tmp/" + fileName, path + fileName, (err) =>
		{
			if (err) console.log(err);
			console.log("upload-end " + path + fileName);
			socket.emit("refresh");
		})
		delete uploadStream[fileName];
		uploadBusy = false;
	})

	const statSender = setInterval(() => 
	{
		socket.emit("file-explorer-status", 
		{
			uploadBusy: uploadBusy,
			uploadList: Object.keys(uploadStream)
		});
	}, 1000);
}