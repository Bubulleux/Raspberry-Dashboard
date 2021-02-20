socket = io()

socket.emit("get-os-info");
socket.emit("get-os-info-static");
setInterval(() =>
{
    socket.emit("get-os-info");
}, 15000);

socket.on("os-info", (info) =>
{
    for(var key in info)
    {
        if (key ==="cpuLoad")
        {
            $("#info-" + key).text(Math.round(info[key]));
        }
        else if (key ==="cpuTemp")
        {
            
            $("#info-" + key).text(Math.round(info[key]));
        }
        else
        {
            $("#info-" + key).text(info[key]);
        }
    }
})

socket.on("os-info-static", (info) =>
{
    for(var key in info)
    {
        $("#info-" + key).text(info[key]);
    }
})

function shutdown(reboot)
{
    socket.emit("shutdown", reboot);
}