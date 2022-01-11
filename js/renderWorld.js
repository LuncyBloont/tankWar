/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
var gameWorld;
(function (gameWorld) {
    gameWorld.camera = {
        position: glm.vec3(0., 0., 5.),
        front: glm.vec3(0., 0., -1.),
        right: glm.vec3(1., 0., 0.),
        up: glm.vec3(0., 1., 0.),
        fov: 65.
    };
    gameWorld.renderObjects = [];
    function fixCamera() {
        gameWorld.camera.front = glm.normalize(gameWorld.camera.front);
        gameWorld.camera.right = glm.normalize(glm.cross(gameWorld.camera.front, glm.vec3(0., 1., 0.)));
        gameWorld.camera.up = glm.cross(gameWorld.camera.right, gameWorld.camera.front);
    }
    /**
     * Make the camera look at 'end' from 'start' in world space
     * @param start glm.vec3
     * @param end glm.vec3
     */
    function lookAt(start, end) {
        gameWorld.camera.position = start;
        gameWorld.camera.front = end['-'](start);
        fixCamera();
    }
    gameWorld.lookAt = lookAt;
    function setCameraAndDirection(pos, dir) {
        gameWorld.camera.position = pos;
        gameWorld.camera.front = dir;
        fixCamera();
    }
    gameWorld.setCameraAndDirection = setCameraAndDirection;
    function getCameraMatrix() {
        return glm.mat4(gameWorld.camera.right.x, gameWorld.camera.up.x, -gameWorld.camera.front.x, 0., gameWorld.camera.right.y, gameWorld.camera.up.y, -gameWorld.camera.front.y, 0., gameWorld.camera.right.z, gameWorld.camera.up.z, -gameWorld.camera.front.z, 0., 0., 0., 0., 1.)['*'](glm.mat4(1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., -gameWorld.camera.position.x, -gameWorld.camera.position.y, -gameWorld.camera.position.z, 1.));
    }
    gameWorld.getCameraMatrix = getCameraMatrix;
    /**
     * Set a set of rendering objects
     * @param pos glm.vec3
     * @param rotate glm.vec3
     * @param scale glm.vec3
     * @param model string
     * @param count number
     */
    function setObject(pos, rotate, scale, model, count) {
        gameWorld.renderObjects.push();
    }
    gameWorld.setObject = setObject;
})(gameWorld || (gameWorld = {}));
