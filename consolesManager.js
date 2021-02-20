const pty = require("node-pty");

var consoles = []

class Console
{
	constructor(name)
	{
		this.consoleName = name;
		this.process = pty.spawn("bash", []);
		this.Write("cd ~ \r");
		this.process.onData((data) =>
		{
			this.output += data;
		})
		this.process.onExit(() =>
		{
			for( var i = 0; i < consoles.length; i++)
			{
				if (consoles[i] === this)
				{
					consoles.splice(i, 1);
				}
			}
		})
		this.output = "";
	}
	Write(input)
	{
		this.process.write(input);
	}
}



function GetConsole(consoleName)
{
	for(curConsole in consoles)
	{
		if (consoles[curConsole].consoleName === consoleName)
		{
			return consoles[curConsole];
		}
	}
	return undefined;
}

exports.NewConsole = (consoleName) =>
{
	consoles.push(new Console(consoleName))
}

exports.WriteConsole = (consoleName, input) =>
{
	GetConsole(consoleName).Write(input);
}

exports.ExitConsole = (consoleName) =>
{
	GetConsole(consoleName).Write("exit\r")
}

exports.GetConsoles = () =>
{
	var consolesName = [];
	for(curConsole in consoles)
	{
		consolesName.push(consoles[curConsole].consoleName);
	}
	return consolesName;
}

exports.GetOutputs = () =>
{
	var outputs = {};
	for(curConsole in consoles)
	{
		outputs[consoles[curConsole].consoleName] = consoles[curConsole].output;
	}
	return outputs;
}
