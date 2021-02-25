var socket = io();

var files = undefined;
var currentPath = undefined;
var selectedFile = undefined;

var copyFile = undefined;
var copyPath = undefined;
var cutFile = false;

var shortcut = [];

var fileExplorerStatus = undefined;

var activeOnSelect = [$("#btn-rename"),$("#btn-delete"),$("#btn-copy"),$("#btn-cut"),$("#btn-download")];

$("#btn-past").attr("disabled", "");

resetBtn();

$(document).on('click', function() {
	$("#upload-menu").removeAttr("show");
});
  

function getPath() { return $("#path").val(); }

function setPath(path) 
{ 
	$("#path").val(path);
	checkShortcut();
}

function select(index)
{
	if (selectedFile != undefined)
	{
		$("#files").children().eq(selectedFile).removeAttr("set");
	}
	$("#files").children().eq(index).attr("set", '');
	selectedFile = index;
	for(curBtn of activeOnSelect)
	{
		curBtn.removeAttr("disabled");
	}
}

function openFile(index)
{
	if (files[index].folder)
	{
		setPath(getPath() + files[index].name + "/");
		getFile();
	}
	else
	{
		download();
	}
}

function pathIsValid(path)
{
	let firstChar = path.charAt(0);
	let lastChar = path.charAt(path.lenght -1);
	if (firstChar === "/" & lastChar === "/")
	{
		return true;
	}
	else
	{
		return false;
	}
}

function getFileName()
{
	return files[selectedFile].name /*+ (files[selectedFile].folder ? "/" : "")*/;
}

function resetBtn()
{
	for(curBtn of activeOnSelect)
	{
		curBtn.attr("disabled", "");
	}
}

function uploadMenu()
{
	setTimeout(() => {$("#upload-menu").attr("show", "");}, 100);
	
}

function uploadFile()
{
	console.log(document.getElementById('upload-file').files);
	for(curFile of document.getElementById('upload-file').files)
	{
		declareUpload(curFile, curFile.name);
	}
}

function uploadFolder()
{
	console.log(document.getElementById('upload-folder').files);
	for(curFile of document.getElementById('upload-folder').files)
	{
		declareUpload(curFile, curFile.webkitRelativePath);
	}
}

function checkShortcut()
{
	let shortcutListChild = document.getElementById("shortcut-list").childNodes;
	let path = getPath();
	let findShortcut = false;
	for(curChild of shortcutListChild)
	{
		if (curChild.getAttribute("shortcut") === path)
		{
			curChild.setAttribute("set", "");
			findShortcut = true;
		}
		else if (curChild.getAttribute("set") != null)
		{
			curChild.removeAttribute("set");
		}
	}
	let btn = $("#btn-shortcut");
	let html = ""
	if (findShortcut)
	{
		html = `<i class="fa fa-minus" aria-hidden="true"></i> Remove Shortcut`;
	}
	else
	{
		html = `<i class="fa fa-plus" aria-hidden="true"></i> Add Shortcut`;
	}
	btn.html(html);
}

function partTime(time)
{
	let timeSplit = time.split("T")
	timeSplit[1] = timeSplit[1].slice(0, timeSplit[1].length - 5);
	let newTime = timeSplit[0] + " " + timeSplit[1]
	return newTime;
}

function parseSize(size)
{
	const unit = 
	{
		"B": 10 ** 3 ,
		"KB": 10 ** 6,
		"MB": 10 ** 9,
		"GB": 10 ** 12,
		"TB": Infinity,
	};

	for(let key in unit)
	{
		if (size < unit[key])
		{
			return "" + (Math.round(size / unit[key] * 10 ** 4) / 10) + " " + key;
		}
	}
	return undefined;
}

//Request------------------------------------------
function back()
{
	let path = getPath();
	let newPath = path.slice(0, path.lastIndexOf("/", getPath().length - 3) + 1)
	setPath(newPath);
	getFile();
}

function newFolder()
{
	var folderName = prompt("Folder Name:")
	socket.emit("mkdir", getPath(), folderName);
	getFile();
}

function rename()
{
	let rename = prompt("");
	socket.emit("rename", getPath() ,getFileName(), rename);
	getFile();
}

function deleteFile()
{
	socket.emit("delete", getPath() + getFileName());
}

function copy()
{
	copyFile = getFileName();
	copyPath = getPath();
	cutFile = false;
	$("#btn-past").removeAttr("disabled");
}

function cut()
{
	copyFile = getFileName()+ (files[selectedFile].folder ? "/" : "");
	copyPath = getPath();
	cutFile = true;
	$("#btn-past").removeAttr("disabled");
}

function past()
{
	socket.emit("copy", copyPath, getPath(), copyFile, cutFile);
}

function download()
{
	console.log(getPath() + getFileName());
	socket.emit("download", getPath(), getFileName());
}

function getFile()
{
	if (!pathIsValid(getPath()))
	{
		alert("Sorry the path is not valid.")
		return;
	}
	socket.emit("get-files", getPath());
}

function getShortcut() { socket.emit("get-shortcut"); }

function addShortcut()
{
	if (shortcut.indexOf(getPath()) == -1)
	{
		socket.emit("add-shortcut", getPath())
	}
	else
	{
		socket.emit("remove-shortcut", getPath())
	}
}

//Reponse------------------------------------------

socket.on("send-file", (filesReceived, path) =>
{
	setPath(path);
	let tableHtml = ""
	i = 0;
	for(let curFile of filesReceived)
	{
		let fileHtml = `<tr onclick='select(${i})' ondblclick='openFile(${i})'>
						<td><i class="fa fa-${curFile.folder ? 'folder': 'file-o'}" aria-hidden="true"></i>  ${curFile.name}</td>
						<td>${partTime(curFile.modified)}</td><td>${partTime(curFile.creation)}</td><td>${curFile.folder? "" : parseSize(curFile.size)}</td></tr>`;
		tableHtml += fileHtml;
		i++;
	}
	$("#files").html(tableHtml);
	files = filesReceived;
	selectedFile = undefined;
	currentPath = path;
	resetBtn();
});

socket.on("error", (error) =>
{
	alert(error);
})

socket.on("open", (url) => {open(url)});

socket.on("refresh", () =>
{
	getFile();
})

socket.on("file-explorer-status", (status) =>
{
	fileExplorerStatus = status;
})

socket.on("send-shortcut", (shortcutSend) =>
{
	shortcut = shortcutSend;
	let shortcutHtml = "";
	
	for( curShortcut of shortcut)
	{
		let shortShortCut = curShortcut.slice(curShortcut.lastIndexOf("/", curShortcut.length - 3) + 1 , curShortcut.length - 1) + "/";
		shortcutHtml += `<li title='${curShortcut}' onclick='setPath("${curShortcut}"); getFile()' shortcut='${curShortcut}'>${shortShortCut}</li>`;
	}
	$("#shortcut-list").html(shortcutHtml);
	checkShortcut()
})

getShortcut();