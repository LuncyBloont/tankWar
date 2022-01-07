/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />

const world = {
    camera: {
        position: glm.vec3(0., 0., -15.),
        front: glm.vec3(0., 0., 1.),
        force: glm.vec3(0., 0., 0.),
    },
    gameObjects: [

    ]
}

function setObject(pos: Array<number>, rotate: Array<number>, scale: Array<number>,
    model: string, count: number) {
    world.gameObjects.push
}
