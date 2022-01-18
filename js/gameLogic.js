/// <reference path="./renderWorld.ts" />
var logicDeltaTime = 0.01;
var gameEvent = {};
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
        this.time = new Date().getTime();
        var msg = this.getMessage();
        var retry = 3;
        var xmlTrans = new XMLHttpRequest();
        xmlTrans.open('POST', '');
        xmlTrans.addEventListener('load', function (ev) {
            if (xmlTrans.responseText != 'timeout') {
                func(xmlTrans.responseText);
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
function worldUpdate(delta) {
    var fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z);
    if (gameEvent['w']) {
        gameWorld.camera.position['+='](glm.normalize(fpsf)['*'](0.015 * delta));
    }
    if (gameEvent['s']) {
        gameWorld.camera.position['-='](glm.normalize(fpsf)['*'](0.015 * delta));
    }
    if (gameEvent['a']) {
        gameWorld.camera.position['-='](gameWorld.camera.right['*'](0.015 * delta));
    }
    if (gameEvent['d']) {
        gameWorld.camera.position['+='](gameWorld.camera.right['*'](0.015 * delta));
    }
    if (gameEvent['h']) {
        var nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['k']) {
        var nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.8) {
        var nf = gameWorld.camera.front['+'](glm.vec3(0., 0.0027 * delta, 0.));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.8) {
        var nf = gameWorld.camera.front['-'](glm.vec3(0., 0.0027 * delta, 0.));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
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
    var lastTime = new Date().getTime();
    setInterval(function () {
        var now = new Date().getTime();
        worldUpdate(now - lastTime);
        gameWorld.logicLoop(now - lastTime);
        lastTime = now;
    }, 1000 * logicDeltaTime);
}
