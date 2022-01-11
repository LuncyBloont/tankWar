/// <reference path="./renderWorld.ts" />
var logicDeltaTime = 0.01;
var gameEvent = {};
function worldUpdate() {
    var fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z);
    if (gameEvent['w']) {
        gameWorld.camera.position['+='](glm.normalize(fpsf)['*'](0.3));
    }
    if (gameEvent['s']) {
        gameWorld.camera.position['-='](glm.normalize(fpsf)['*'](0.3));
    }
    if (gameEvent['a']) {
        gameWorld.camera.position['-='](gameWorld.camera.right['*'](0.3));
    }
    if (gameEvent['d']) {
        gameWorld.camera.position['+='](gameWorld.camera.right['*'](0.3));
    }
    if (gameEvent['h']) {
        var nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.05)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['k']) {
        var nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.05)['*'](glm.length(fpsf)));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.8) {
        var nf = gameWorld.camera.front['+'](glm.vec3(0., 0.05, 0.));
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf);
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.8) {
        var nf = gameWorld.camera.front['-'](glm.vec3(0., 0.05, 0.));
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
    setInterval(function () {
        worldUpdate();
    }, 1000 * logicDeltaTime);
}
