/// <reference path="./gameLogic.ts" />
/// <reference path="./renderWorld.ts" />
/// <reference path="./playerConfig.ts" />
/// <reference path="./frame.ts" />

const magicMaxTime = 20 * 1000

class GameAction {
    t = ''
    p: Array<number>
    r: Array<number>
}

class TransBase {
    n: string
    p: Array<number> = []
    r: Array<number> = []
    a: Array<GameAction> = []
}

class MagicImage extends GameObject {
    willCaching: boolean = false

    timeToPost: number = 1000.

    network: NetworkStatus<TransBase> = new NetworkStatus()

    playerObjPool: Array<OtherPlayer> = []

    lastTime = 0

    lock: number = 0

    sendStatus() {
        if (new Date().getTime() - this.lock < magicMaxTime) {
            return
        }
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
        this.network.post((s: string) => {
            let bag = JSON.parse(s)
            if (bag.time >= this.lastTime) {
                this.renderObj(bag.list)
                this.lastTime = bag.time
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

    renderObj(otherList: Array<TransBase>) {
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
                localOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2])
                localOne.name = netOne.n
                localOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2])
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
        this.perLogic = function (self: MagicImage, delta: number) {
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
                console.log(c + '  ' + n)
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
        console.log(gl.getProgramInfoLog(textProg))
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

function gameConfig1() {
    let tmp = new MagicImage()
    gameWorld.Objects.push(tmp)

    let oplist = []
    for (let i = 0; i < 16; i++) {
        let op = new OtherPlayer()
        let nb = new NameBoard()
        nb.target = op
        op.nameBoard = nb
        oplist.push(op)
        gameWorld.Objects.push(op)
        gameWorld.Objects.push(nb)
    }

    tmp.playerObjPool = oplist
}