/// <reference path="./renderWorld.ts" />
var logicDeltaTime = 0.01;
var gameEvent = {};
var timeFix = 1e9;
function localTime() {
    return Date.now() - timeFix;
}
var NetworkStatus = /** @class */ (function () {
    function NetworkStatus() {
    }
    NetworkStatus.prototype.getMessage = function () {
        return JSON.stringify({
            'owner': this.owner,
            'body': this.massage,
            'time': this.time
        });
    };
    NetworkStatus.prototype.post = function (func, timeoutFunc) {
        this.time = Date.now();
        var msg = this.getMessage();
        var retry = 3;
        var xmlTrans = new XMLHttpRequest();
        xmlTrans.open('POST', '');
        xmlTrans.addEventListener('load', function (ev) {
            if (xmlTrans.responseText != 'timeout') {
                var bag = JSON.parse(xmlTrans.responseText);
                timeFix = Math.min(Date.now() - bag.serverTime, timeFix);
                func(bag);
            }
            else {
                timeoutFunc();
            }
        });
        xmlTrans.addEventListener('error', function (ev) {
            retry -= 1;
            if (retry >= 0) {
                console.warn("A message retry to send (".concat(retry, ")"));
                xmlTrans.send(msg);
            }
        });
        xmlTrans.send(msg);
    };
    return NetworkStatus;
}());
var cvelocity = glm.vec3(0);
var conGround = false;
var gMapCenter = [99, 100];
var gMapScale = 350;
var gMapZMin = -50;
var gMapZMax = 50;
var gMapWidth = 1920;
var gMapHeight = 1920;
function getHeight(x, z, assetName, center, scale, zmin, zmax, width, height) {
    var ccx = center[0], ccy = center[1], cscale = scale, cz0 = zmin, cz1 = zmax;
    var cx = (x - ccx) / cscale + 0.5;
    var cy = (-z - ccy) / cscale + 0.5;
    var cz = 0;
    if (cx < 0 || cx >= 1 || cy <= 0 || cy > 1) {
        cz = 0;
    }
    else {
        var p00 = assets[assetName][(height - Math.floor(cy * height)) * width + Math.floor(cx * width)];
        var p01 = assets[assetName][(height - Math.floor(cy * height)) * width + Math.floor(cx * width + 1)];
        var p10 = assets[assetName][(height - Math.floor(cy * height + 1)) * width + Math.floor(cx * width)];
        var p11 = assets[assetName][(height - Math.floor(cy * height + 1)) * width + Math.floor(cx * width + 1)];
        var xlerp = cx * width - Math.floor(cx * width);
        var ylerp = cy * height - Math.floor(cy * height);
        cz = (p00 * (1 - xlerp) + p10 * xlerp) * (1 - ylerp) + (p01 * (1 - xlerp) + p11 * xlerp) * ylerp;
    }
    cz = cz / 256 * (cz1 - cz0) + cz0;
    return cz;
}
var cameraLerpPos = glm.vec3(0);
function worldUpdate(delta) {
    var playerHeight = 3;
    var g = glm.vec3(0., -20., 0.);
    var speed = 0.085;
    var maxSlip = 0.4;
    var playerSize = 1.0;
    var sampleSize = 0.3;
    var sample = 8;
    var move = glm.vec3(0);
    var fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z);
    if (gameEvent['w']) {
        move['+='](glm.normalize(fpsf)['*'](0.015 * delta));
    }
    if (gameEvent['s']) {
        move['-='](glm.normalize(fpsf)['*'](0.015 * delta));
    }
    if (gameEvent['a']) {
        move['-='](gameWorld.camera.right['*'](0.015 * delta));
    }
    if (gameEvent['d']) {
        move['+='](gameWorld.camera.right['*'](0.015 * delta));
    }
    move = glm.normalize(move)['*'](speed * delta);
    if (gameEvent['h']) {
        var nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['k']) {
        var nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.9) {
        var nf = gameWorld.camera.front['+'](glm.vec3(0., 0.0027 * delta, 0.));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.9) {
        var nf = gameWorld.camera.front['-'](glm.vec3(0., 0.0027 * delta, 0.));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    cvelocity['+='](g['*'](delta / 1000.0));
    var m$makeF = function (a, b) {
        var c = Math.abs(b * delta / 1000.);
        if (Math.abs(a) < Math.abs(c)) {
            return 0;
        }
        else {
            return Math.sign(a) * (Math.abs(a) - c);
        }
    };
    var makeF = function (v, f) {
        v.x = m$makeF(v.x, f.x);
        v.y = m$makeF(v.y, f.y);
        v.z = m$makeF(v.z, f.z);
    };
    var fixMove = function (pos) {
        var newH = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight);
        conGround = cameraLerpPos.y <= (newH + playerHeight) || conGround;
        if (!conGround)
            return;
        cvelocity['+='](move);
        var r = sampleSize;
        var p0 = glm.vec3(r, getHeight(pos.x + r, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, 0);
        var p1 = glm.vec3(0, getHeight(pos.x, pos.z + r, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, r);
        var p2 = glm.vec3(-r, getHeight(pos.x - r, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, 0);
        var p3 = glm.vec3(0, getHeight(pos.x, pos.z - r, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, -r);
        var n0 = glm.normalize(glm.cross(p0, p1));
        var n1 = glm.normalize(glm.cross(p1, p2));
        var n2 = glm.normalize(glm.cross(p2, p3));
        var n3 = glm.normalize(glm.cross(p3, p0));
        var n = glm.normalize(n0['+'](n1)['+'](n2)['+'](n3));
        if (glm.length(glm.vec2(n.x, n.z)) > maxSlip) {
            n = glm.vec3(-n.x, -n.y, -n.z);
        }
        else {
            n = glm.normalize(glm.vec3(0, -n.y, 0));
        }
        cvelocity['+='](n['*'](Math.min(speed * delta * 4, Math.max(0, (newH - (cameraLerpPos.y - playerHeight)) * 5))));
        makeF(cvelocity, glm.vec3(cvelocity.x * 5., cvelocity.y * 15.6, cvelocity.z * 5.));
    };
    for (var i = 0; i < sample; i++) {
        var r = Math.random() * Math.PI * 2;
        var l = Math.random() * playerSize;
        fixMove(cameraLerpPos['+'](glm.vec3(Math.cos(r) * l, 0, Math.sin(r) * l)));
    }
    cameraLerpPos['+='](cvelocity['*'](delta / 1000.));
    makeF(cvelocity, glm.vec3(cvelocity.x * 1., cvelocity.y * 1., cvelocity.z * 1.));
    gameWorld.camera.position = gameWorld.camera.position['*'](0.9)['+'](cameraLerpPos['*'](0.1));
}
function beforeAllUpdate() {
    conGround = false;
}
function bindEvent() {
    document.body.addEventListener('keydown', function (ev) {
        gameEvent[ev.key] = true;
    });
    document.body.addEventListener('keyup', function (ev) {
        gameEvent[ev.key] = false;
    });
}
function gameStart() {
    bindEvent();
    var lastTime = Date.now();
    setInterval(function () {
        var now = Date.now();
        beforeAllUpdate();
        gameWorld.logicLoop(now - lastTime);
        worldUpdate(now - lastTime);
        lastTime = now;
    }, 1000 * logicDeltaTime);
}
