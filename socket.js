const si = require('systeminformation');
const consolesManager = require("./consolesManager");
const fs = require("fs-extra");
const compressing = require("compressing");
const pathJs = require("path");

const password = "admin";

const uploadStream = {}

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
	socket.on("upload-start", (fileName) =>
	{
		console.log("upload-start " + fileName);
		let path = "./public/tmp/" + pathJs.dirname(fileName);
		if (!fs.existsSync(path))
		{
			fs.mkdir(path);
		}
		uploadStream[fileName] = fs.createWriteStream("./public/tmp/" + fileName);
		uploadStream[fileName].on("error", (err) =>
		{
			console.log(err);
		})
	})

	socket.on("upload", (fileName, packet) =>
	{
		var buffer = Buffer.from(packet);
		uploadStream[fileName].write(buffer);
	})

	socket.on("upload-end", (fileName, path) =>
	{
		console.log("upload-end " + path + fileName);
		uploadStream[fileName].end();
		console.log("upload End");
	})

}