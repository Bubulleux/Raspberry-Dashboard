const express = require("express")
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const fs = require("fs-extra");
const sckt = require("./socket")(io);
const { count } = require("console");
const pagesInfo = require("./pagesInfo");
const { exit } = require("process");
const terminals = [];

app.use(express.static("public"))


app.all("*", (request, reponse, next) =>
{
	if(false)
	{

	}
	else if (request.url === "/")
	{
		reponse.redirect("/dashboard");
		return
	}
	fs.readFile("./public/" + pagesInfo.pages[request.url], "utf-8", (err, data) =>
	{
		if (err) reponse.status(404)
		else
		{
			reponse.send(data);
			reponse.end();
			next();
		}
	});
})

//app.use(siofu.router);

server.listen(8080, () =>
{
	console.log("Server On");
});

function removeTmp()
{
	console.log("Cleaning tmp...")
	fs.emptyDirSync(__dirname + "/public/tmp")
	console.log("Cleaning finish");
}

removeTmp();

process.on("SIGINT", () =>
{
	console.log("exit")
	removeTmp();
	process.exit(0);
})