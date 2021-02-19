var socket = io();

function openTerminal(terminal)
{
    window.location.href = "/terminal/?name:'" + terminal + "'";
}

function killTerminal(terminal)
{
    console.log("Kill " + terminal)
    socket.emit("killTerminal", terminal)
    window.location.reload()
}