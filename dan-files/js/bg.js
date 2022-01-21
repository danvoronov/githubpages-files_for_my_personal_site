var canvas = document.getElementById("starfield")
canvas.height = window.innerHeight+100
canvas.width = 500

var context = canvas.getContext("2d"),
stars = 1500,
colorrange = [0,60,240];
LargeYpos = new Array();
LargeXpos = new Array();
Largespeed= new Array();

const mColor = "hsla(125, 85%, 69%,0.9)"
const fColor = "hsla(125, 85%, 65%,0.6)"

for (var i = 0; i < stars; i++) {
    var x = Math.random() * canvas.offsetWidth,
    y = Math.random() * canvas.offsetHeight*0.2-200

    LargeYpos.push(y)
    LargeXpos.push(x)
    Largespeed.push(3+Math.random()*5) 

    context.beginPath();
    context.arc(x, y, 0.5, 0, 360);
    context.fillStyle = mColor;
    context.fill()
}

fly()

function fly() { 
    var WinHeight = window.innerHeight, WinWidth = window.innerWidth;
    var hscrll = window.pageYOffset;

    for (i = 0; i < stars; i++) {
      LargeYpos[i] += Largespeed[i];
      if (LargeYpos[i] > WinHeight+200) {
        LargeYpos[i] = Math.random() * WinHeight;
        LargeXpos[i] = Math.random() * WinWidth;
      }

        context.beginPath();
        context.arc(LargeXpos[i], LargeYpos[i], 0.5+Math.random()*0.2, 0, 360);
        context.fillStyle = fColor;
        context.fill()
    }

    setTimeout('fly()', 300);
}                                             
                                            
