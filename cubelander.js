/**
 * Created with IntelliJ IDEA.
 * User: andrewr
 * Date: 16/06/13
 * Time: 4:49 PM
 * To change this template use File | Settings | File Templates.
 */

var circlesCount = 100; // Circles count used by the wormhole
var offsetX = 70; // Wormhole center offset (X)
var offsetY = 40; // Wormhole center offset (Y)
var maxDepth = 1.5; // Maximal distance for a circle
var circleDiameter = 10.0; // Circle diameter
var depthSpeed = 0.001; // Circle speed
var angleSpeed = 0.05; // Circle angular rotation speed

var canvas = document.getElementById("backgroundCanvas");
var context = canvas.getContext("2d");
var stats = document.getElementById("stats");
var debugPlace = document.getElementById("debugPlace");

// game world variables

// Game world in game units(GU)
var worldXmin = 0;
var worldXmax = 1000;
var worldYmin = 0;
var worldYmax = 1000;
var groundY = 980;      // ground-level

// Lander centre point (GU)
var landerX = 500;
var landerY = 100;

var landerSize = 30;

var landerVX = 0;
var landerVY = 0;

var gravityY = 0.05;

var thrusterY = -0.07;

// Viewport (GU)
var viewX_TL = 0;    // TL = TopLeft
var viewY_TL = 0;
var viewX_BR = 1000; // BR = BottomRight
var viewY_BR = 1000;

// Viewport size in screen units (SU)
var screenWidth = 600;
var screenHeight = 600;


var mouseDown = 0;

document.body.onmousedown = function() {
    ++mouseDown;
}
document.body.onmouseup = function() {
    --mouseDown;
}

function initLander() {
    landerX = 500;
    landerY = 70;
    landerVY = 0;
    landerVX = 0;
}

function worldToScreen(x, y) {
    var viewToScreenScaleX = screenWidth / (viewX_BR - viewX_TL);
    var viewToScreenScaleY = screenHeight / (viewY_BR - viewY_TL);

    // TODO: change for wrap-around world
    var viewX = x - viewX_TL;
    var viewY = y - viewY_TL;

    var screenX = viewX * viewToScreenScaleX;
    var screenY = viewY * viewToScreenScaleY;

    return { x: screenX, y: screenY };
}

function drawGround() {
    var su = worldToScreen(0, groundY);
    context.strokeStyle = "rgba(255,30,30,255)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, su.y);
    context.lineTo(screenWidth, su.y);
    context.stroke();
}

function drawLander() {
    var suTL = worldToScreen(landerX - landerSize, landerY - landerSize);
    var suBR = worldToScreen(landerX + landerSize, landerY + landerSize);

    context.strokeStyle = "rgba(30,30,130,255)";
    context.lineWidth = 2;

    context.moveTo(suTL.x, suTL.y);
    context.lineTo(suBR.x, suTL.y);
    context.lineTo(suBR.x, suBR.y);
    context.lineTo(suTL.x, suBR.y);
    context.lineTo(suTL.x, suTL.y);
    context.stroke();
}

function applyPhysics() {

    // gravity
    landerVY = landerVY + gravityY;

    // TODO: thrusters
    if(mouseDown) {
        landerVY = landerVY + thrusterY;
    }

    landerX = landerX + landerVX;
    landerY = landerY + landerVY;

    // ground collision
    if((landerY + landerSize) >= groundY) {
        landerY = groundY - landerSize;
        landerVY = 0;
    }
}

// --------------------------------------------------------------------------

// Fonction de projection
function perspective(fov, aspectRatio, x, y) {
    var yScale = Math.pow(Math.tan(fov / 2.0), -1);
    var xScale = yScale / aspectRatio;

    var M11 = xScale;
    var M22 = yScale;

    var outx = x * M11 + canvas.width / 2.0;
    var outy = y * M22 + canvas.height / 2.0;

    return { x: outx, y: outy };
}

// Définition de la function cercle
function Circle(initialDepth, initialAngle, intensity) {
    var angle = initialAngle;
    this.depth = initialDepth;
    var color = intensity;

    this.draw = function () {
        var x = offsetX * Math.cos(angle);
        var y = offsetY * Math.sin(angle);

        var project = perspective(0.9, canvas.width / canvas.height, x, y);
        var diameter = circleDiameter / this.depth;

        var ploX = project.x - diameter / 2.0;
        var ploY = project.y - diameter / 2.0;

        context.beginPath();
        context.arc(ploX, ploY, diameter, 0, 2 * Math.PI, false);
        context.closePath();

        var opacity = 1.0 - this.depth / maxDepth;
        context.strokeStyle = "rgba(" + color + "," + color + "," + color + "," + opacity + ")";
        context.lineWidth = 4;

        context.stroke();

        this.depth -= depthSpeed;
        angle += angleSpeed;

        if (this.depth < 0) {
            this.depth = maxDepth + this.depth;
        }
    };
}

// Initialization
var circles = [];

var angle = Math.random() * Math.PI * 2.0;

var depth = maxDepth;
var depthStep = maxDepth / circlesCount;
var angleStep = (Math.PI * 2.0) / circlesCount;
for (var index = 0; index < circlesCount; index++) {
    circles[index] = new Circle(depth, angle, index % 5 == 0 ? 200 : 255);

    depth -= depthStep;
    angle -= angleStep;
}

// FPS
var previous = [];
function computeFPS() {
    if (previous.length > 60) {
        previous.splice(0, 1);
    }
    var start = (new Date).getTime();
    previous.push(start);
    var sum = 0;

    for (var id = 0; id < previous.length - 1; id++) {
        sum += previous[id + 1] - previous[id];
    }

    var diff = 1000.0 / (sum / previous.length);

    stats.innerHTML = diff.toFixed(1) + " fps";
}

// Drawing & Animation
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

// Draw some rule lines fo debugging
function drawGrids() {
    context.strokeStyle = "rgba(0,255,0,255)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo(screenWidth, screenHeight);
    context.moveTo(0,screenHeight);
    context.lineTo(screenWidth, 0);
    context.stroke();
}

function wormHole() {
    computeFPS();
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight - 130 - 40;
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    clearCanvas();

    /*
    for (var index = 0; index < circlesCount; index++) {
        circles[index].draw();
    }
    */

    applyPhysics();

    drawGrids();
    drawGround();
    drawLander();

    debugPlace.innerHTML =  "x = " + landerX.toFixed(3) + ", y = " + landerY.toFixed(3) + ", vY = " + landerVY.toFixed(3);

    /*
    circles.sort(function (a, b) {
        if (a.depth > b.depth)
            return -1;
        if (a.depth < b.depth)
            return 1;
        return 0;
    });
    */
}

var wormHoleIntervalID = -1;

function startWormHole() {
    initLander();

    if (wormHoleIntervalID > -1)
        clearInterval(wormHoleIntervalID);

    wormHoleIntervalID = setInterval(wormHole, 16);

    document.getElementById("wormHole").onclick = stopWormHole;
    document.getElementById("wormHole").innerHTML = "Standard Mode";
}

function stopWormHole() {
    if (wormHoleIntervalID > -1)
        clearInterval(wormHoleIntervalID);

    clearCanvas();
    document.getElementById("wormHole").onclick = startWormHole;
    document.getElementById("wormHole").innerHTML = "Wormhole Mode";
}

stopWormHole();


