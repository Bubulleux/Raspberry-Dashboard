const fileQueue = {}

function declareUpload(file, fileName)
{
	console.log("File Upload " + fileName);

	let path = getPath()

	var reader = new FileReader();
	reader.onload = (evt) =>
	{
		if (evt.target.readyState == FileReader.DONE)
		{
			let fileBuffer = evt.target.result;
			socket.emit("upload-declare", fileName);
			fileQueue[fileName] = 
			{
				name: fileName,
				buffer: fileBuffer,
				path: path,
			}
		}
	};
	console.log(file)
	reader.readAsArrayBuffer(file);
}

function upload(fileName)
{
	console.log("upload Start");

	let file = fileQueue[fileName];
	let veiw = new Int8Array(file.buffer);
	let packet = []
	socket.emit("upload-start", file.name);
	let sendPacket = () =>
	{
		socket.emit("upload", file.name, packet);
		packet = [];
	}

	for(bit of veiw)
	{
		packet.push(bit);
		if (packet.length >= 350)
		{
			sendPacket();
		};
	}
	sendPacket();
	socket.emit("upload-end", file.name, file.path);
	delete fileQueue[fileName];
}

setInterval(() =>
{
	if (fileExplorerStatus != undefined && fileExplorerStatus.uploadBusy === false && Object.keys(fileQueue).length > 0)
	{
		console.log(Object.keys(fileQueue).length)
		fileExplorerStatus.uploadBusy = true;
		upload(Object.keys(fileQueue)[0]);
	}
})