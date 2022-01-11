/// <reference path="./renderWorld.ts" />

const logicDeltaTime = 0.01
const gameEvent = {}

function worldUpdate() {
    let fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z)
    if (gameEvent['w']) {
        gameWorld.camera.position['+='](glm.normalize(fpsf)['*'](0.3))
    }
    if (gameEvent['s']) {
        gameWorld.camera.position['-='](glm.normalize(fpsf)['*'](0.3))
    }
    if (gameEvent['a']) {
        gameWorld.camera.position['-='](gameWorld.camera.right['*'](0.3))
    }
    if (gameEvent['d']) {
        gameWorld.camera.position['+='](gameWorld.camera.right['*'](0.3))
    }
    if (gameEvent['h']) {
        let nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.05)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['k']) {
        let nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.05)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.8) {
        let nf = gameWorld.camera.front['+'](glm.vec3(0., 0.05, 0.))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.8) {
        let nf = gameWorld.camera.front['-'](glm.vec3(0., 0.05, 0.))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
}

function bindEvent() {
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
        gameEvent[ev.key] = true
    })
    document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
        gameEvent[ev.key] = false
    })
}

function gameStart() {
    bindEvent()
    setInterval(() => {
        worldUpdate()
    }, 1000 * logicDeltaTime)
}