/// <reference path="./renderWorld.ts" />
/// <reference path="./frame.ts" />
/// <reference path="./playerConfig.ts" />

const logicDeltaTime = 0.01
const gameEvent = {}
let timeFix = 1e9

const SYSColor = 'FFCA78'

function localTime(): number {
    return Date.now() - timeFix
}

class AudioQueue {
    queueL: Array<HTMLAudioElement> = []
    queueR: Array<HTMLAudioElement> = []
    qid = 0
    size: number = 4
    constructor(count: number, assetL: string, assetR: string) {
        for (let i = 0; i < count; i++) {
            let al: HTMLAudioElement = <HTMLAudioElement>(<HTMLAudioElement>assets[assetL]).cloneNode(true)
            let ar: HTMLAudioElement = <HTMLAudioElement>(<HTMLAudioElement>assets[assetR]).cloneNode(true)

            this.queueL.push(al)
            this.queueR.push(ar)
        }
    }

    play(pos: any, volume: number): number {
        pos = gameWorld.getCameraMatrix()['*'](glm.vec4(pos, 1))
        pos = glm.vec3(pos)
        let l = glm.vec3(-this.size, 0., 0.)
        let r = glm.vec3(+this.size, 0., 0.)
        this.qid = (this.qid + 1) % this.queueL.length
        try {
            let la = this.queueL[this.qid]
            let ra = this.queueR[this.qid]
            la.volume = Math.min(1, volume / Math.pow(glm.distance(pos, l), 2))
            ra.volume = Math.min(1, volume / Math.pow(glm.distance(pos, r), 2))
            la.currentTime = 0
            ra.currentTime = 0
            la.play()
            ra.play()
        } catch (err) { }

        return this.qid
    }

    fixPosition(id: number, pos: any, volume: number): boolean {
        pos = gameWorld.getCameraMatrix()['*'](glm.vec4(pos, 1))
        pos = glm.vec3(pos)
        let l = glm.vec3(-this.size, 0., 0.)
        let r = glm.vec3(+this.size, 0., 0.)
        let la = this.queueL[id]
        let ra = this.queueR[id]
        try {
            la.volume = Math.min(1, volume / Math.pow(glm.distance(pos, l), 2))
            ra.volume = Math.min(1, volume / Math.pow(glm.distance(pos, r), 2))
        } catch (err) { }
        return la.ended && ra.ended
    }
}

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
    post(func: (msg: any) => void, timeoutFunc: () => void) {
        this.time = Date.now()
        let msg = this.getMessage()
        let xmlTrans = new XMLHttpRequest()
        let url = assets['config_network'] ? assets['config_network']['multiplayURL'] : ''
        xmlTrans.open('POST', url)
        xmlTrans.addEventListener(
            'load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
                if (xmlTrans.responseText != 'timeout') {
                    let bag = JSON.parse(xmlTrans.responseText)
                    timeFix = Math.min(Date.now() - bag.serverTime, timeFix)
                    func(bag)
                } else {
                    timeoutFunc()
                }
            }
        )
        xmlTrans.addEventListener(
            'error', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
                timeoutFunc()
            }
        )
        xmlTrans.send(msg)
    }
}

let cvelocity = glm.vec3(0)
let conGround = false

const gMapCenter = [99, 100]
const gMapScale = 350
const gMapZMin = -50
const gMapZMax = 50
const gMapWidth = 1920
const gMapHeight = 1920

const spwanPoint = glm.vec3(0., 15., 5.)

function getHeight(x: number, z: number, assetName: string, center: Array<number>,
    scale: number, zmin: number, zmax: number, width: number, height: number): number {
    let ccx = center[0], ccy = center[1], cscale = scale, cz0 = zmin, cz1 = zmax
    let cx = (x - ccx) / cscale + 0.5
    let cy = (-z - ccy) / cscale + 0.5
    let cz = 0
    if (cx < 0 || cx >= 1 || cy <= 0 || cy > 1) {
        cz = -1
    } else {
        let p00 = assets[assetName][(height - Math.floor(cy * height)) * width + Math.floor(cx * width)]
        let p01 = assets[assetName][(height - Math.floor(cy * height)) * width + Math.floor(cx * width + 1)]
        let p10 = assets[assetName][(height - Math.floor(cy * height + 1)) * width + Math.floor(cx * width)]
        let p11 = assets[assetName][(height - Math.floor(cy * height + 1)) * width + Math.floor(cx * width + 1)]
        let xlerp = cx * width - Math.floor(cx * width)
        let ylerp = cy * height - Math.floor(cy * height)
        cz = (p00 * (1 - xlerp) + p10 * xlerp) * (1 - ylerp) + (p01 * (1 - xlerp) + p11 * xlerp) * ylerp
    }
    cz = cz / 256 * (cz1 - cz0) + cz0
    return cz
}

let cameraLerpPos = glm.vec3(0)

function worldUpdate(delta: number) {
    const playerHeight = 3
    const g = glm.vec3(0., -20., 0.)
    const speed = 0.085
    const quikSpeed = 0.125
    const maxSlip = 0.4
    const playerSize = 1.0
    const sampleSize = 0.3
    const sample = 8

    if (gameEvent['y'] || gameEvent['Y']) {
        tank.playerMBoxInput.focus()
    }

    let move = glm.vec3(0)
    let fpsf = glm.vec3(gameWorld.camera.front.x, 0., gameWorld.camera.front.z)
    if (gameEvent['w']) {
        move['+='](glm.normalize(fpsf)['*'](0.015 * delta))
    }
    if (gameEvent['s']) {
        move['-='](glm.normalize(fpsf)['*'](0.015 * delta))
    }
    if (gameEvent['a']) {
        move['-='](gameWorld.camera.right['*'](0.015 * delta))
    }
    if (gameEvent['d']) {
        move['+='](gameWorld.camera.right['*'](0.015 * delta))
    }

    let spd = speed
    if (gameEvent['W']) {
        move['+='](glm.normalize(fpsf)['*'](0.015 * delta))
        spd = quikSpeed
    }
    if (gameEvent['S']) {
        move['-='](glm.normalize(fpsf)['*'](0.015 * delta))
        spd = quikSpeed
    }
    if (gameEvent['A']) {
        move['-='](gameWorld.camera.right['*'](0.015 * delta))
        spd = quikSpeed
    }
    if (gameEvent['D']) {
        move['+='](gameWorld.camera.right['*'](0.015 * delta))
        spd = quikSpeed
    }
    move = glm.normalize(move)['*'](spd * delta)
    if (gameEvent['h']) {
        let nf = gameWorld.camera.front['-'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['k']) {
        let nf = gameWorld.camera.front['+'](gameWorld.camera.right['*'](0.0027 * delta)['*'](glm.length(fpsf)))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['u'] && gameWorld.camera.front.y < 0.9) {
        let nf = gameWorld.camera.front['+'](glm.vec3(0., 0.0027 * delta, 0.))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }
    if (gameEvent['j'] && gameWorld.camera.front.y > -0.9) {
        let nf = gameWorld.camera.front['-'](glm.vec3(0., 0.0027 * delta, 0.))
        gameWorld.setCameraAndDirection(gameWorld.camera.position, nf)
    }

    cvelocity['+='](g['*'](delta / 1000.0))

    let m$makeF = (a: any, b: any) => {
        let c = Math.abs(b * delta / 1000.)
        if (Math.abs(a) < Math.abs(c)) {
            return 0
        } else {
            return Math.sign(a) * (Math.abs(a) - c)
        }
    }
    let makeF = (v: any, f: any) => {
        v.x = m$makeF(v.x, f.x)
        v.y = m$makeF(v.y, f.y)
        v.z = m$makeF(v.z, f.z)
    }

    let fixMove = (pos: any) => {
        let newH = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight)
        if (newH < gMapZMin) {
            let s = `<span style="color: #FFAA22"> [ 玩家掉出地图，已重置位置 ] </span>`
            tank.gameLog(s, '规则', '#787878')
            player.messageList.push(s)
            cameraLerpPos = glm.vec3(spwanPoint)
            return
        }
        conGround = cameraLerpPos.y <= (newH + playerHeight) || conGround
        if (!conGround) return
        cvelocity['+='](move)
        let r = sampleSize
        let p0 = glm.vec3(r, getHeight(pos.x + r, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, 0)
        let p1 = glm.vec3(0, getHeight(pos.x, pos.z + r, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, r)
        let p2 = glm.vec3(-r, getHeight(pos.x - r, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, 0)
        let p3 = glm.vec3(0, getHeight(pos.x, pos.z - r, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) - pos.y + playerHeight, -r)

        let n0 = glm.normalize(glm.cross(p0, p1))
        let n1 = glm.normalize(glm.cross(p1, p2))
        let n2 = glm.normalize(glm.cross(p2, p3))
        let n3 = glm.normalize(glm.cross(p3, p0))

        let n = glm.normalize(n0['+'](n1)['+'](n2)['+'](n3))
        if (glm.length(glm.vec2(n.x, n.z)) > maxSlip) {
            n = glm.vec3(-n.x, -n.y, -n.z)
        } else {
            n = glm.normalize(glm.vec3(0, -n.y, 0))
        }

        cvelocity['+='](n['*'](Math.min(speed * delta * 4, Math.max(0, (newH - (cameraLerpPos.y - playerHeight)) * 5))))
        makeF(cvelocity, glm.vec3(cvelocity.x * 5., cvelocity.y * 15.6, cvelocity.z * 5.))
    }
    for (let i = 0; i < sample; i++) {
        let r = Math.random() * Math.PI * 2
        let l = Math.random() * playerSize
        fixMove(cameraLerpPos['+'](glm.vec3(Math.cos(r) * l, 0, Math.sin(r) * l)))
    }

    let l = glm.length(cvelocity) 
    if (l > 60) {
        cvelocity = cvelocity['/'](l / 60)
    }
    cameraLerpPos['+='](cvelocity['*'](delta / 1000.))
    makeF(cvelocity, glm.vec3(cvelocity.x * 1., cvelocity.y * 1., cvelocity.z * 1.))

    gameWorld.camera.position = gameWorld.camera.position['*'](0.9)['+'](cameraLerpPos['*'](0.1))
}

function beforeAllUpdate() {
    conGround = false
}

function bindEvent() {
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
        if (tank.playerMBoxInput.id == document.activeElement.id) return
        gameEvent[ev.key] = true
    })
    document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
        gameEvent[ev.key] = false
    })
    tank.playerMBoxInput.addEventListener('keydown', (ev: KeyboardEvent) => {
        if (ev.key == 'Enter') {
            tank.gameLog(tank.playerMBoxInput.value, '(you)' + player.playerID.substring(0,  player.playerID.indexOf('>>$<<')), 'ACACFF')
            player.messageList.push(tank.playerMBoxInput.value)
            tank.playerMBoxInput.value = ''
            tank.canvas.focus()
            tank.playerMBoxInput.blur()
        }
        if (ev.key == 'Tab') {
            tank.canvas.focus()
            tank.playerMBoxInput.blur()
        }
    })
}

function gameStart() {
    bindEvent()
    let lastTime = Date.now()
    setInterval(() => {
        let now = Date.now()
        beforeAllUpdate()
        gameWorld.logicLoop(now - lastTime)
        worldUpdate(now - lastTime)
        lastTime = now
    }, 1000 * logicDeltaTime)
}