/// <reference path="./playerConfig.ts" />
/// <reference path="./frame.ts" />
/// <reference path="./gameLogic.ts" />
/// <reference path="./renderWorld.ts" />

const magicMaxTime = 20 * 1000

class GameAction {
    n = ''
    p: Array<number>
    r: Array<number>
    t: number
}

class TransBase {
    n: string
    p: Array<number> = []
    r: Array<number> = []
    a: Array<GameAction> = []
}

let colorRule = [
    [1, 0.4, 0.2], [1, 0.9, 0.1], [0.5, 0.9, 0.6], [0.3, 0.8, 1], [0.7, 1, 0.3], [0.2, 0.9, 1]
]

class FirecrackerEffect extends GameObject {
    speed: number = 3
    acceleration: number = 0.7
    speed_k = 0
    color: any = glm.vec3(1.0, 0.8, 0.3)
    light = 0
    startTime = 0
    radius = 16

    lightPower = 445
    lightPowerChange = 115
    randomColor = true
    constructor() {
        super()
        this.emission = 1
        this.color = glm.vec3(1, 1, 1)
        this.texColor = glm.vec3(this.color)
        this.model = 'model_feffect'
        this.texture = 'texture_red'
        this.textureASM = 'texture_red'
        this.textureNormals = 'texture_normal'
        this.textureAS = 'texture_black'
        this.textureEmission = 'texture_fEmission'
        this.active = false
        let boom = false
        this.perLogic = (self: FirecrackerEffect, delta: number) => {
            self.scale['+='](glm.vec3(self.speed_k * delta / 1000))
            self.speed_k -= self.acceleration * delta / 1000
            let l = gameWorld.getLight(self.light)
            l.position = glm.vec3(self.position)
            l.power = (self.lightPower + Math.cos(localTime() - self.startTime * 0.00074) * self.lightPowerChange) * Math.pow(self.speed_k / self.speed, 3)
            l.rgb = glm.vec3(self.color)
            self.alpha = Math.pow(self.speed_k / self.speed, 0.8)
            self.emission = Math.pow(self.speed_k / self.speed, 0.7) * 2
            
            if (glm.distance(self.position, gameWorld.camera.position) < this.radius && !boom) {
                let to = gameWorld.camera.position['-'](self.position['-'](glm.vec3(0, 2, 0)))
                cvelocity['+='](glm.normalize(to)['*'](59925 / Math.pow(glm.length(to), 2)))
                let s = '<span style="color: #898989">我被击中了 QAQ </span>'
                player.messageList.push(s)
                tank.gameLog(s, '你', 'FFAA23')
            }
            if (!boom) boom = true

            if (self.speed_k < 0) {
                this.active = false
                l.power = 0
                boom = false
            }
        }
    }
}

class BoomEffect extends FirecrackerEffect {
    constructor() {
        super()
        this.lightPower = 233
        this.lightPowerChange = 33
        this.speed = 3
        this.acceleration = 6
        this.color = glm.vec3(1., 0.9, 0.7)
        this.model = 'model_boomRound'
        this.textureEmission = 'texture_boomRound'
    }
}


class NewYearBall extends GameObject {
    fireTime: number = 5
    startTime: number = -1
    startPosition: any = glm.vec3(0, 0, 0)
    startRotation: any = glm.vec3(0, 0, 0)
    audio1NameL = 'audio_readyLeft'
    audio1NameR = 'audio_readyRight'
    audio2NameL = 'audio_boomLeft'
    audio2NameR = 'audio_boomRight'
    
    feffect: FirecrackerEffect

    poolID: number = -1
    P: (spos: any, time: number) => any = (spos: any, time: number) => {
        return spos['+'](glm.vec3(0, time < 3 ? 0 : 0.5 * 36 * Math.pow(time - 3, 2), 0))
    }
    R: (srot: any, time: number) => any = (srot: any, time: number) => {
        return srot['+'](glm.vec3(0, time < 3 ? 0 : 0.5 * 26 * Math.pow(time - 3, 2), 0))
    }

    toogle: (self: NewYearBall, delta: number) => boolean = () => false

    aqueue: AudioQueue

    queue2: AudioQueue

    constructor(pid: number) {
        super()
        this.feffect = new FirecrackerEffect()
        this.poolID = pid
        this.texture = 'texture_firecracker0'
        this.textureASM = 'texture_firecracker0ASM'
        this.textureAS = 'texture_firecracker0AS'
        this.textureNormals = 'texture_firecracker0Normals'
        this.textureEmission = 'texture_firecracker0Emisson'
        this.model = 'model_firecracker0'
        this.aqueue = new AudioQueue(1, this.audio2NameL, this.audio2NameR)
        this.queue2 = new AudioQueue(2, this.audio1NameL, this.audio1NameR)
        let audiok = -1
        let audiok2 = -1
        this.perLogic = (self: NewYearBall, delta: number) => {
            let t = (localTime() - self.startTime) / 1000
            self.position = self.P(self.startPosition, t)
            self.rotation = self.R(self.startRotation, t)
            if (t < 3) {
                if (audiok < 0 || self.queue2.fixPosition(audiok, self.position, 0.4)) {
                    audiok = self.queue2.play(self.position, 0.4)
                }
            } else {
                if (audiok2 < 0) {
                    audiok2 = self.queue2.play(self.position, 3)
                }
                if (audiok2 >= 0) {
                    self.queue2.fixPosition(audiok2, self.position, 3)
                }
            }
            if (t > self.fireTime || self.toogle(self, delta)) {
                self.active = false
                let fe = self.feffect
                fe.active = true
                fe.position = glm.vec3(self.position)
                fe.speed_k = fe.speed
                fe.light = gameWorld.newLight(fe)
                fe.startTime = localTime()
                fe.scale = glm.vec3(2)
                fe.rotation = glm.vec3(self.rotation)
                if (fe.randomColor) {
                    let col = colorRule[self.startTime % colorRule.length]
                    fe.color = glm.vec3(col[0], col[1], col[2])
                    fe.texColor = glm.vec3(col[0], col[1], col[2])
                }
                self.aqueue.play(self.position, 600)
            }
        }
    }
}

class Fire1Ball extends NewYearBall {
    constructor(idx: number) {
        super(idx)
        this.model = 'model_firecracker3'
        this.texture = 'texture_firecracker3'
        this.textureASM = 'texture_firecracker3ASM'
        this.textureAS = 'texture_firecracker3AS'
        this.textureNormals = 'texture_firecracker3Normals'
        this.textureEmission = 'texture_black'
        this.feffect = new BoomEffect()
        this.P = (spos: any, time: number) => {
            let to = glm.vec3(0, 0, -1)
            to = gameWorld.rotateVec3(to, this.startRotation)
            return spos['+'](to['*'](Math.pow(time * 0.2, 2) * 6 + 26 * time))['+'](glm.vec3(0, -1, 0)['*'](Math.pow(3 * time, 2) * 0.5))
        }
        this.R = (srot: any, time: number) => {
            return glm.vec3(srot.x, srot.y, srot.z + Math.pow(time, 2) * 4 + time * 2)
        }
        this.toogle = (self: Fire1Ball, delta: number) => {
            let h = getHeight(self.position.x, self.position.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight)
            if (h >= self.position.y - 1) {
                // self.position.y = h + 1
                return true
            }
            return false
        }
    }
}

class AtomPool {
    pool: Array<NewYearBall> = []
    sid = 0
    putTime = 0
    putMinTime = 2
    acKey = 'x'
    creator: (i: number) => NewYearBall
    genPos: () => any
    genRot: () => any
    activeOne(pos: any, rot: any, time: number) {
        this.sid = (this.sid + 1) % this.pool.length
        let o = this.pool[this.sid]
        o.active = true
        o.startPosition = pos
        o.startRotation = rot
        o.startTime = time
    }
    constructor(count: number, pmint: number, key: string, create: (i: number) => NewYearBall, genP: () => any, genR: () => any) {
        this.putMinTime = pmint
        this.acKey = key
        this.creator = create
        for (let i = 0; i < count; i++) {
            this.pool.push(this.creator(i))
        }
        this.genPos = genP
        this.genRot = genR
    }
}

class MagicImage extends GameObject {
    willCaching: boolean = false

    timeToPost: number = 1000.

    network: NetworkStatus<TransBase> = new NetworkStatus()

    playerObjPool: Array<OtherPlayer> = []

    lastTime = 0

    lock: number = 0

    light: number

    pool: Array<AtomPool> = []

    sendStatus() {
        if (new Date().getTime() - this.lock < magicMaxTime) {
            return
        }

        for (let i = 0; i < player.messageList.length; i++) {
            let ac = new GameAction()
            ac.n = 'msg:' + player.messageList[i]
            ac.p = [0, 0, 0]
            ac.r = [0, 0, 0]
            ac.t = localTime()
            this.network.massage.a.push(ac)
        }
        player.messageList.splice(0, player.messageList.length)

        let safeAction = this.network.massage.a
        this.network.massage.p = [
            gameWorld.camera.position.x,
            gameWorld.camera.position.y,
            gameWorld.camera.position.z
        ]
        this.network.massage.r = [
            gameWorld.camera.front.x,
            gameWorld.camera.front.y,
            gameWorld.camera.front.z
        ]
        this.network.massage.n = this.network.owner
        this.network.post((s: any) => {
            let bag = s
            if (bag.time >= this.lastTime) {
                this.renderObj(bag.list, false)
                this.lastTime = bag.time
            } else {
                this.renderObj(bag.list, true)
            }
            this.lock = 0
        }, () => {
            for (let i in this.network.massage.a) {
                safeAction.push(this.network.massage.a[i])
            }
            this.network.massage.a = safeAction
            this.lock = 0
        })
        this.network.massage.a = []
        this.lock = new Date().getTime()
    }

    compareAction(old: Array<GameAction>, newo: Array<GameAction>): boolean {
        if (old.length != newo.length) return false
        for (let i = 0; i < old.length; i++) {
            let a = old[i]
            let b = newo[i]
            if (a.n != b.n) return false
            if (a.t != b.t) return false
            if (a.p[0] != b.p[0] || a.p[1] != b.p[1] || a.p[2] != b.p[2]) return false
            if (a.r[0] != b.r[0] || a.r[1] != b.r[1] || a.r[2] != b.r[2]) return false
        }
        return true
    }

    renderObj(otherList: Array<TransBase>, old: boolean) {
        for (let i in this.playerObjPool) {
            this.playerObjPool[i].mark = false
        }
        let getFromLocal = (name: string) => {
            for (let i in this.playerObjPool) {
                if (this.playerObjPool[i].name == name) {
                    this.playerObjPool[i].mark = true
                    return this.playerObjPool[i]
                }
            }
            return null
        }
        for (let i = 0; i < otherList.length; i++) {
            let netOne = otherList[i]
            let localOne = getFromLocal(netOne.n)
            if (localOne) {
                if (!old) {
                    localOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2])
                    localOne.name = netOne.n
                    localOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2])
                }
                localOne.nameBoard.active = true
            } else {
                let newOne = getFromLocal('')
                newOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2])
                newOne.name = netOne.n
                newOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2])
                newOne.active = true
                newOne.mark = true
                newOne.nameBoard.active = true
                newOne.nameBoard.refreshNameText()
                console.log(`${newOne.name}加入游戏`)
                tank.gameLog(`${netOne.n.substring(0, netOne.n.indexOf('>>$<<'))}加入游戏`, '系统', SYSColor)
                localOne = newOne
            }

            if (!this.compareAction(localOne.oldAction, netOne.a)) {
                for (let j = 0; j < netOne.a.length; j++) {
                    let action = netOne.a[i]
                    if (action.n.indexOf('weap:') == 0) {
                        let ki = parseInt(action.n.substring(5, action.n.length))
                        this.pool[ki].activeOne(glm.vec3(action.p[0], action.p[1], action.p[2]),
                            glm.vec3(action.r[0], action.r[1], action.r[2]), action.t)
                    } else if (action.n.indexOf('msg:') == 0) {
                        tank.gameLog(action.n.substring(4, action.n.length), netOne.n.substring(0, netOne.n.indexOf('>>$<<')), 'FFAAEE')
                    }
                }
                localOne.oldAction = netOne.a
            }
        }
        for (let i in this.playerObjPool) {
            if (!this.playerObjPool[i].mark) {
                this.playerObjPool[i].name = ''
                this.playerObjPool[i].active = false
                this.playerObjPool[i].nameBoard.active = false
            }
        }
    }

    constructor() {
        super()
        this.position = glm.vec3(4., 0., 10.)
        this.network.massage = new TransBase()
        this.network.owner = player.playerID
        this.model = 'model_netFace'
        this.texture = 'texture_face0'
        this.textureASM = 'texture_face0ASM'
        this.textureAS = 'texture_face0AS'
        this.textureNormals = 'texture_face0Normals'
        this.show = false

        this.pool.push(new AtomPool(32, 1, '1', (i: number) => new NewYearBall(i),
            () => {
                let front = glm.normalize(glm.vec2(gameWorld.camera.front.x, gameWorld.camera.front.z))
                let pos = gameWorld.camera.position['+'](
                    glm.vec3(front.x, 0, front.y)['*'](4)
                )
                pos.y = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight)
                return pos
            }, () => {
                let rot = glm.vec3(0, Math.atan2(gameWorld.camera.front.x, gameWorld.camera.front.z), 0)
                return rot
            }))
        this.pool.push(new AtomPool(32, 2, '2', (i: number) => new Fire1Ball(i),
            () => {
                return gameWorld.camera.position['+'](gameWorld.camera.front['*'](2))
            }, () => {
                return gameWorld.camera.readOnlyRotation
            }))

        this.preGame = (self: MagicImage, gl: WebGL2RenderingContext) => {
            self.light = gameWorld.newLight(self)
            gameWorld.getLight(self.light).rgb = glm.vec3(0.97, 0.34, 0.56)
            gameWorld.getLight(self.light).power = 5.0
        }

        this.perLogic = function (self: MagicImage, delta: number) {

            if (gameWorld.getLightHost(self.light) != self) {
                self.light = gameWorld.newLight(self)
                gameWorld.getLight(self.light).rgb = glm.vec3(0.97, 0.34, 0.56)
                gameWorld.getLight(self.light).power = 5.0
            }
            gameWorld.getLight(self.light).position = glm.vec3(self.position)

            let diff = gameWorld.camera.position['+'](glm.vec3(0., -0.8, 0.))['-'](self.position)
            let diffLen = glm.length(diff)
            if (diffLen > 3. && diffLen < 16. && self.willCaching) {
                self.position['+='](glm.normalize(diff)['*'](0.01 * delta))
                self.rotation.y = Math.atan2(-diff.x, -diff.z)
            }
            if (diffLen < 4.) {
                self.willCaching = true
            }
            if (diffLen > 16.) {
                self.willCaching = false
            }

            // ############################### weapon logic ######################################
            (function () {
                for (let i = 0; i < self.pool.length; i++) {
                    self.pool[i].putTime += delta / 1000
                    if (self.pool[i].putTime > self.pool[i].putMinTime) self.pool[i].putTime = self.pool[i].putMinTime

                    if (gameEvent[self.pool[i].acKey] && self.pool[i].putTime >= self.pool[i].putMinTime) {
                        self.pool[i].putTime = 0
                        let t = localTime()
                        let pos = self.pool[i].genPos()
                        let rot = self.pool[i].genRot()
                        /*let front = glm.normalize(glm.vec2(gameWorld.camera.front.x, gameWorld.camera.front.z))
                        let pos = gameWorld.camera.position['+'](
                            glm.vec3(front.x, 0, front.y)['*'](4)
                        )
                        pos.y = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight)
                        let rot = glm.vec3(0, Math.atan2(diff.x, diff.z), 0)*/
                        self.pool[i].activeOne(pos, rot, t)
                        let a = new GameAction()
                        a.p = [pos.x, pos.y, pos.z]
                        a.r = [rot.x, rot.y, rot.z]
                        a.t = t
                        a.n = 'weap:' + i
                        self.network.massage.a.push(a)
                    }
                }
            })()

            // ############################### weapon logic END ######################################

            self.timeToPost -= delta
            if (self.timeToPost < 0) {
                self.timeToPost = 125.
                self.sendStatus()
            }
            if (Math.random() > 1.0 - 1.0 / 5000) {
                self.show = true
            }
            if (Math.random() > 1.0 - 1.0 / 15) {
                self.show = false
            }
        }
    }
}

class OtherPlayer extends GameObject {
    mark: boolean
    netPosition: any = glm.vec3(0., 3., 0.)
    netFront: any = glm.vec3(0., 0., -1.)
    front: any = glm.vec3(0., 0., -1.)

    nameBoard: NameBoard = null

    size: number = 4

    oldAction: Array<GameAction> = []

    constructor() {
        super()
        this.active = false
        this.name = ''
        this.model = 'model_player0'
        this.texture = 'texture_player0'
        this.textureASM = 'texture_player0ASM'
        this.textureAS = 'texture_player0AS'
        this.textureNormals = 'texture_player0Normals'
        this.textureEmission = 'texture_player0Emission'
        this.scale = glm.vec3(2., 2., 2.)
        let t = 0
        this.perLogic = function (self: OtherPlayer, delta: number) {
            let lerp = (a: any, b: any, c: number) => {
                return a['*'](1 - c)['+'](b['*'](c))
            }

            self.position = lerp(self.position, self.netPosition, 0.15)
            self.front = lerp(self.front, self.netFront, 0.15)
            self.front = glm.normalize(self.front)

            let front2 = glm.vec2(self.front.x, self.front.z)
            self.rotation.y = Math.atan2(-front2.x, -front2.y)
            self.rotation.x = Math.atan2(self.front.y, glm.length(front2))
            let dis = glm.distance(self.position, gameWorld.camera.position)
            if (dis < self.size) {
                cvelocity['-='](glm.normalize(self.position['-'](gameWorld.camera.position))['*']((self.size - dis) * 12))
                if (gameWorld.camera.position.y - self.position.y > self.size / 2) {
                    conGround = true
                }
            }
        }
    }
}

class NameBoard extends GameObject {

    target: OtherPlayer = null
    ts: Array<number> = []

    refreshNameText() {
        let l = 0
        let n = this.target.name.substring(0, this.target.name.indexOf('>>$<<'))
        let r = 8
        if (n.length == 0) {
            n = '没有名字的人'
        }
        if (n.length < 8) {
            l = Math.floor((8 - n.length) / 2)
            r = l + n.length
        }
        this.ts = []
        for (let i = 0; i < 8; i++) {
            this.ts.push(-1)
            if (i >= l && i < r) {
                let c = n.charAt(i - l).charCodeAt(0)
                let idxa = 'a'.charCodeAt(0)
                let idxz = 'z'.charCodeAt(0)
                let idxA = 'A'.charCodeAt(0)
                let idxZ = 'Z'.charCodeAt(0)
                let idx0 = '0'.charCodeAt(0)
                let idx9 = '9'.charCodeAt(0)
                let idx = 36
                if (c >= idxa && c <= idxz) idx = c - idxa
                if (c >= idxA && c <= idxZ) idx = c - idxA
                if (c >= idx0 && c <= idx9) idx = c - idx0 + 26
                this.ts[i] = idx
            }
        }
    }

    constructor() {
        super()
        this.model = 'model_text'
        this.texture = 'texture_abc'
        this.scale = glm.vec3(0.6, 1., 1.)
        let gl = tank.gameGL
        let textProg = gl.createProgram()
        let vsdr = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vsdr, assets['shader_textVert'])
        gl.compileShader(vsdr)
        gl.attachShader(textProg, vsdr)
        let fsdr = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fsdr, assets['shader_textFrag'])
        gl.compileShader(fsdr)
        gl.attachShader(textProg, fsdr)
        gl.linkProgram(textProg)
        this.shaderProgram = textProg
        this.shadow = false

        this.perLogic = (self: NameBoard, delta: number) => {
            self.position = this.target.position['+'](glm.vec3(0., 2., 0.))
            let diff = gameWorld.camera.position['+'](glm.vec3(0., -0.8, 0.))['-'](self.position)
            self.rotation.y = Math.atan2(-diff.x, -diff.z)
        }

        this.perFrame = (self: NameBoard, ngl: WebGL2RenderingContext, delta: number, shadow: boolean) => {
            if (!shadow && self.ts.length > 0) {
                ngl.uniform1iv(ngl.getUniformLocation(textProg, 'text'), new Int32Array(self.ts))
            }
        }
    }
}

function mapInit() {
    let tmp = new GameObject()
    tmp.model = 'model_mapBeach'
    tmp.texture = 'texture_mapBeach'
    tmp.textureASM = 'texture_mapBeachASM'
    tmp.textureAS = 'texture_mapBeachAS'
    tmp.textureNormals = 'texture_mapBeachNormals'
    tmp.perLogic = (self: GameObject, delta: number) => { }
    tmp.noiseSize = 8096
    tmp.noiseForce = 0.05
    gameWorld.objects.push(tmp)
    tmp = new GameObject()
    tmp.model = 'model_mapColl'
    tmp.texture = 'texture_mapColl'
    tmp.textureASM = 'texture_mapCollASM'
    tmp.textureAS = 'texture_mapCollAS'
    tmp.textureNormals = 'texture_mapCollNormals'
    tmp.perLogic = (self: GameObject, delta: number) => { }
    tmp.noiseSize = 2048
    tmp.noiseForce = 0.12
    gameWorld.objects.push(tmp)
    tmp = new GameObject()
    tmp.model = 'model_mapCover'
    tmp.texture = 'texture_mapCover'
    tmp.textureASM = 'texture_mapCoverASM'
    tmp.textureAS = 'texture_mapCoverAS'
    tmp.textureNormals = 'texture_mapCoverNormals'
    tmp.perLogic = (self: GameObject, delta: number) => { }
    tmp.noiseSize = 2038
    tmp.noiseForce = 0.2
    gameWorld.objects.push(tmp)
    tmp = new GameObject()
    tmp.model = 'model_mapPlants'
    tmp.texture = 'texture_mapPlants'
    tmp.textureASM = 'texture_mapPlantsASM'
    tmp.textureAS = 'texture_mapPlantsAS'
    tmp.textureNormals = 'texture_mapPlantsNormals'
    tmp.perLogic = (self: GameObject, delta: number) => { }
    tmp.noiseSize = 1024
    tmp.noiseForce = 0.1
    gameWorld.objects.push(tmp)
}

function gameConfig1() {
    mapInit()

    let tmp = new MagicImage()
    gameWorld.objects.push(tmp)

    let oplist = []
    for (let i = 0; i < 16; i++) {
        let op = new OtherPlayer()
        let nb = new NameBoard()
        nb.target = op
        op.nameBoard = nb
        oplist.push(op)
        gameWorld.objects.push(op)
        gameWorld.objects.push(nb)
    }

    tmp.playerObjPool = oplist

    let tmp2 = new GameObject()
    tmp2.position = glm.vec3(38, 23, -59)
    let old = tmp2.perLogic
    tmp2.perLogic = (self: GameObject, delta: number) => {
        old(self, delta)
        self.position.y = getHeight(self.position.x, self.position.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) + 3
    }
    gameWorld.objects.push(tmp2)

    for (let pi = 0; pi < tmp.pool.length; pi++) {
        for (let i = 0; i < tmp.pool[pi].pool.length; i++) {
            tmp.pool[pi].pool[i].active = false
            gameWorld.objects.push(tmp.pool[pi].pool[i])
            gameWorld.objects.push(tmp.pool[pi].pool[i].feffect)
        }
    }
}