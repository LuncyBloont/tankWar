/// <reference path="./gameLogic.ts" />
/// <reference path="./renderWorld.ts" />
/// <reference path="./playerConfig.ts" />

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

    sendStatus() {
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
        this.network.massage.n = this.network.owner.substring(0, this.network.owner.indexOf('>>$<<'))
        if (this.network.massage.n.length == 0) {
            this.network.massage.n = '没名字的人'
        }
        this.network.post((s: string) => {
            this.renderObj(JSON.parse(s))
        })
        this.network.massage.a = []
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
            } else {
                let newOne = getFromLocal('')
                newOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2])
                newOne.name = netOne.n
                newOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2])
                newOne.active = true
                newOne.mark = true
                console.log(`${newOne.name}加入游戏`)
            }
        }
        for (let i in this.playerObjPool) {
            if (!this.playerObjPool[i].mark) {
                this.playerObjPool[i].name = ''
                this.playerObjPool[i].active = false
            }
        }
    }

    constructor() {
        super()
        this.position = glm.vec3(4., 0., 10.)
        this.network.massage = new TransBase()
        this.network.owner = player.playerID
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
        }
    }
}

class OtherPlayer extends GameObject {
    mark: boolean
    netPosition: any = glm.vec3(0., 3., 0.)
    netFront: any = glm.vec3(0., 0., 1.)
    front: any = glm.vec3(0., 0., 1.)
    constructor() {
        super()
        this.active = false
        this.name = ''
        this.perLogic = function(self: OtherPlayer, delta: number) {
            let lerp = (a: any, b: any, c: number) => {
                return a['*'](1 - c)['+'](b['*'](c))
            }

            self.position = lerp(self.position, self.netPosition, 0.3)
            self.front = lerp(self.front, self.netFront, 0.3)
            self.front = glm.normalize(self.front)

            let front2 = glm.vec2(self.front.x, self.front.z)
            self.rotation.y = Math.atan2(-front2.x, -front2.y)
            self.rotation.x = Math.atan2(self.front.y, glm.length(front2))

        }
    }
}

function gameConfig1() {
    let tmp = new MagicImage()
    gameWorld.Objects.push(tmp)

    let oplist = []
    for (let i = 0; i < 16; i++) {
        let op = new OtherPlayer()
        oplist.push(op)
        gameWorld.Objects.push(op)
    }

    tmp.playerObjPool = oplist
}