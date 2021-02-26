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
const cookieParser = require("cookie-parser");
const { urlencoded } = require("express");
const setting = require("./setting")

app.use(express.static("public"))
//app.use(cookieParser);
app.use(express.urlencoded());
app.use(express.json())


app.all("*", (request, reponse, next) =>
{
	if(request.url === "/authen")
	{
		let passwordSend = request.body.password;
	}
	else if (request.url === "/")
	{
		reponse.redirect("/dashboard");
		return
	}
	else
	{
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
	}
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