/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />

namespace gameWorld {
    export const camera = {
        position: glm.vec3(0., 0., 5.),
        front: glm.vec3(0., 0., -1.),
        right: glm.vec3(1., 0., 0.),
        up: glm.vec3(0., 1., 0.),
        fov: 65.
    }
    export const renderObjects = [

    ]

    function fixCamera() {
        camera.front = glm.normalize(camera.front)
        camera.right = glm.normalize(glm.cross(camera.front, glm.vec3(0., 1., 0.)))
        camera.up = glm.cross(camera.right, camera.front)
    }

    /**
     * Make the camera look at 'end' from 'start' in world space
     * @param start glm.vec3
     * @param end glm.vec3
     */
    export function lookAt(start: any, end: any) {
        camera.position = start
        camera.front = end['-'](start)
        fixCamera()
    }

    export function setCameraAndDirection(pos: any, dir: any) {
        camera.position = pos
        camera.front = dir
        fixCamera()
    }

    export function getCameraMatrix() {
        return glm.mat4(
            camera.right.x, camera.up.x, -camera.front.x, 0.,
            camera.right.y, camera.up.y, -camera.front.y, 0.,
            camera.right.z, camera.up.z, -camera.front.z, 0.,
            0., 0., 0., 1.
        )['*'](glm.mat4(
            1., 0., 0., 0.,
            0., 1., 0., 0.,
            0., 0., 1., 0.,
            -camera.position.x, -camera.position.y, -camera.position.z, 1.
        ))
    }

    /**
     * Set a set of rendering objects
     * @param pos glm.vec3
     * @param rotate glm.vec3
     * @param scale glm.vec3
     * @param model string
     * @param count number
     */
    export function setObject(pos: any, rotate: any, scale: any, model: string, count: number) {
        renderObjects.push()
    }
}


