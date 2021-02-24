var socket = io();

var files = undefined;
var currentPath = undefined;
var selectedFile = undefined;

var copyFile = undefined;
var copyPath = undefined;
var cutFile = false;


var activeOnSelect = [$("#btn-rename"),$("#btn-delete"),$("#btn-copy"),$("#btn-cut"),$("#btn-download")];

$("#btn-past").attr("disabled", "");

resetBtn();

$(document).on('click', function() {
	$("#upload-menu").removeAttr("show");
});
  

function getPath() { return $("#path").val(); }

function setPath(path) { $("#path").val(path); }

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
		upload(curFile, curFile.name);
	}
}

function uploadFolder()
{
	console.log(document.getElementById('upload-folder').files);
	for(curFile of document.getElementById('upload-folder').files)
	{
		upload(curFile, curFile.webkitRelativePath);
	}
}

//Request------------------------------------------
function back()
{
	let path = getPath();
	let newPath = path.slice(0, path.lastIndexOf("/", getPath().length - 3)) + "/"
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

function upload(file, name)
{
	console.log("File Upload " + name);

	let path = getPath()

	var reader = new FileReader();
	reader.onload = (evt) =>
	{
		if (evt.target.readyState == FileReader.DONE)
		{
			let fileBuffer = evt.target.result;
			console.log(name);
			let veiw = new Int8Array(fileBuffer);
			let packet = []
			socket.emit("upload-start", name);
			let sendPacket = () =>
			{
				socket.emit("upload", name, packet);
				packet = [];
			}
			for(bit of veiw)
			{
				packet.push(bit);
				if (packet.length >= 500)
				{
					sendPacket();
				};
			}
			sendPacket();
			socket.emit("upload-end", name, path);
			console.log("upload End " + name);
		}
	};
	console.log(file)
	reader.readAsArrayBuffer(file);
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
						<td>${curFile.modified}</td><td>${curFile.creation}</td><td>${curFile.size}</td></tr>`;
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

function dropHandler(ev) {
	console.log('File(s) dropped');

	console.log(evt.dataTransfer.files)
  }