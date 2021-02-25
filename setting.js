const fs = require("fs");

const settingFile = "./settings.json";
var settings = undefined;

function getSetting(settingName)
{
	loadSetting()
	if (settingName == undefined)
	{
		return settings
	}
	else
	{
		return settings[settingName];
	}
}

function setSetting(settingName, value)
{
	loadSetting();
	settings[settingName] = value;
	saveSetting();
}

function loadSetting()
{
	if (settings != undefined) return;
	let rawData = fs.readFileSync(settingFile);
	settings = JSON.parse(rawData);
}

function saveSetting()
{
	let jsonData = JSON.stringify(settings, null, 2);
	fs.writeFileSync(settingFile, jsonData);
}

module.exports = {getSetting, setSetting};