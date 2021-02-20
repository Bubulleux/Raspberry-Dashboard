const express = require("express")
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const fs = require("fs");
const sckt = require("./socket")(io);
const { count } = require("console");
const pagesInfo = require("./pagesInfo");
const terminals = [];

app.use(express.static("public"))


app.all("*", (request, reponse, next) =>
{
	//reponse.redirect("/login");
	fs.readFile("./public/" + pagesInfo.pages[request.url], "utf-8", (err, data) =>
	{
		if (err) reponse.status(404)
		else
		{
			reponse.send(data);
			next();
		}
	});
})



server.listen(8080, () =>
{
	console.log("Server On");
});