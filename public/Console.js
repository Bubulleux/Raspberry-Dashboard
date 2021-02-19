var socket = io();
$("form").submit((e) =>
{
    e.preventDefault()
    socket.emit("input", $("#input").val());
    $("#input").val("")
    return false
})
socket.on("output",(msg) =>
{
    // msgSplit = msg.split("\r")
    // msgSplit.forEach((element) => $("#console").append($("<div>").text(converte(element))));
    msg = converte(msg.replaceAll("\r", "<br>").replaceAll(" ", "&nbsp;"));
    $("#console").append(msg);
    $('#console').scrollTop($('#console')[0].scrollHeight)
    
})

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