/// <reference path="./renderWorld.ts" />

const logicDeltaTime = 0.01
const gameEvent = {}

class NetworkStatus<T> {
    owner: string
    massage: T
    time: number
    getMessage() {
        return JSON.stringify({
            'owner': this.owner,
            'body': this.massage,
            'time': this.time
        })
    }
    post(func: (msg: string) => void, timeoutFunc: () => void) {
        this.time = new Date().getTime()
        let msg = this.getMessage()
        let retry = 3
        let xmlTrans = new XMLHttpRequest()
        xmlTrans.open('POST', '')
        xmlTrans.addEventListener(
            'load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
                if (xmlTrans.responseText != 'timeout') {
                    func(xmlTrans.responseText)
                } else {
                    timeoutFunc()
                }
            }
        )
        xmlTrans.addEventListener(
            'error', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
                retry -= 1
                if (retry >= 0) {
                    console.warn(`A message retry to send (${retry})`)
                    xmlTrans.send(msg)
                }
            }
        )
        xmlTrans.send(msg)
    }
}

function worldUpdate(delta: number) {
    let fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z)
    if (gameEvent['w']) {
        gameWorld.camera.position['+='](glm.normalize(fpsf)['*'](0.015 * delta))
    }
    if (gameEvent['s']) {
        gameWorld.camera.position['-='](glm.normalize(fpsf)['*'](0.015 * delta))
    }
    if (gameEvent['a']) {
        gameWorld.camera.position['-='](gameWorld.camera.right['*'](0.015 * delta))
    }
    if (gameEvent['d']) {
        gameWorld.camera.position['+='](gameWorld.camera.right['*'](0.015 * delta))
    }
    if (gameEvent['h']) {
        let nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['k']) {
        let nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.8) {
        let nf = gameWorld.camera.front['+'](glm.vec3(0., 0.0027 * delta, 0.))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.8) {
        let nf = gameWorld.camera.front['-'](glm.vec3(0., 0.0027 * delta, 0.))
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
    let lastTime = new Date().getTime()
    setInterval(() => {
        let now = new Date().getTime()
        worldUpdate(now - lastTime)
        gameWorld.logicLoop(now - lastTime)
        lastTime = now
    }, 1000 * logicDeltaTime)
}