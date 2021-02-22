var socket = io();

var files = undefined;
var currentPath = undefined;
var selectedFile = undefined;

var copyFile = undefined;
var copyPath = undefined;
var cutFile = false;

var activeOnSelect = [$("#btn-rename"),$("#btn-delete"),$("#btn-copy"),$("#btn-cut"),$("#btn-download")];


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

//Button-------------------------------------------
function back()
{
	let path = getPath();
	let newPath = path.slice(0, path.lastIndexOf("/", getPath().length - 3)) + "/"
	setPath(newPath);
	getFile();
}

function newFile()
{

}

function newFolder()
{

}

function rename()
{
	let rename = prompt("");
	socket.emit("rename",getFileName(), rename);
}

function deleteFile()
{
	socket.emit("delete", getPath() + getFileName());
}

function copy()
{
	copyFile = getFileName();
	copyPath = getPath()
	cutFile = false;
}

function cut()
{
	copyFile = getFileName();
	copyPath = getPath()
	cutFile = true;
}

function past()
{
	socket.emit("copy", copyPath, getPath(), copyFile, cutFile);
}

function download()
{
	socket.emit("download", getPath() + getFile())
}

function upload()
{

}


//Request------------------------------------------

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


//Reponse------------------------------------------

socket.on("send-file", (filesReceived, path) =>
{
	setPath(path);
	let tableHtml = ""
	i = 0;
	for(let curFile of filesReceived)
	{
		let fileHtml = `<tr onclick='select(${i})' ondblclick='openFile(${i})'>
						<td><i class="fa fa-${curFile.folder ? 'folder': 'file'}" aria-hidden="true"></i>  ${curFile.name}</td>
						<td>${curFile.modified}</td><td>${curFile.creation}</td><td>${curFile.size}</td></tr>`;
		tableHtml += fileHtml;
		i++;
	}
	$("#files").html(tableHtml);
	files = filesReceived;
	selectedFile = undefined;
	currentPath = path;
});

socket.on("error", (error) =>
{
	alert(error);
})


for(curBtn of activeOnSelect)
{
	curBtn.attr("disabled", "");
}