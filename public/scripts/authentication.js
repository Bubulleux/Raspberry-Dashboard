socket = io();

function Submit()
{
    var password = $("#password");
    socket.emit("authen", password.val());
    return false;
}

socket.on("authenReponse", (ok, msg) =>
{
    console.log(msg);
    if (ok)
    {
        document.location.href = "/";
    }
})