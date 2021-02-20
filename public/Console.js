var socket = io();
var consolesOutput = {};

socket.emit("getConsoles");

$(window).keydown((event) =>
{
	if (event.which === 13)
	{
		SendInput();
	}
})

function SendInput()
{
	if ($("#console-select").val() === null) return;
	socket.emit("consoleInput", $("#console-select").val() ,$("#console-input input[type='text']").val() + "\r");
	$("#console-input input[type='text']").val("")
}


socket.on("consoleOutput", (output, consoleName) =>
{
	consolesOutput[consoleName] = output;
	UpdateConsole();
})

socket.on("consoles", (consoles) => 
{
	$("#console-select").empty();
	for(curConsole of consoles)
	{
		$("#console-select").append(`<option value="${curConsole}">${curConsole}</option>`);
	}
})

setInterval(GetConsoleOutput, 1000)

function GetConsoleOutput()
{
	if ($("#console-select").val() === null) return;
	socket.emit("getOutput", $("#console-select").val());
}

function NewConsole()
{
	var consoleName = window.prompt("Console Name?")
	socket.emit("newConsole", consoleName);
}

function ExitConsole()
{
	socket.emit("exitConsole", $("#console-select").val());
}

function UpdateConsole()
{
	var output = consolesOutput[$("#console-select").val()];
	if (typeof output !== typeof String())
	{
		$("#output p").html("Select a Console");
		return;
	};
	output = converte(output.replaceAll("\r", "<br>").replaceAll(" ", "&nbsp;"));
	$("#output p").html(output);
	$('#output').scrollTop($('#output')[0].scrollHeight)
}

function converte(str) 
{
	//str = str.replaceAll("", "/e");
	strs = str.split("");
	str = ""
	strs.forEach((value) =>
	{
		if (value.charAt(0) === "]") return
		else if (value.charAt(0) === "[")
		{
			_str = value.split("m");
			style = _str[0];
			_str.shift();
			_srt = _str.join("");
			str += _str;
		}
		else
		{
			str += value
		}
	})
	return str;
}
