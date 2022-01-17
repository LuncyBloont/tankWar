/// <reference path="./gameLogic.ts" />
/// <reference path="./renderWorld.ts" />
/// <reference path="./playerConfig.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameAction = /** @class */ (function () {
    function GameAction() {
        this.t = '';
    }
    return GameAction;
}());
var TransBase = /** @class */ (function () {
    function TransBase() {
        this.p = [];
        this.r = [];
        this.a = [];
    }
    return TransBase;
}());
var MagicImage = /** @class */ (function (_super) {
    __extends(MagicImage, _super);
    function MagicImage() {
        var _this = _super.call(this) || this;
        _this.willCaching = false;
        _this.timeToPost = 1000.;
        _this.network = new NetworkStatus();
        _this.playerObjPool = [];
        _this.position = glm.vec3(4., 0., 10.);
        _this.network.massage = new TransBase();
        _this.network.owner = player.playerID;
        _this.model = 'model_netFace';
        _this.texture = 'texture_face0';
        _this.textureASM = 'texture_face0ASM';
        _this.textureAS = 'texture_face0AS';
        _this.textureNormals = 'texture_face0Normals';
        _this.show = false;
        _this.perLogic = function (self, delta) {
            var diff = gameWorld.camera.position['+'](glm.vec3(0., -0.8, 0.))['-'](self.position);
            var diffLen = glm.length(diff);
            if (diffLen > 3. && diffLen < 16. && self.willCaching) {
                self.position['+='](glm.normalize(diff)['*'](0.01 * delta));
                self.rotation.y = Math.atan2(-diff.x, -diff.z);
            }
            if (diffLen < 4.) {
                self.willCaching = true;
            }
            if (diffLen > 16.) {
                self.willCaching = false;
            }
            self.timeToPost -= delta;
            if (self.timeToPost < 0) {
                self.timeToPost = 125.;
                self.sendStatus();
            }
            if (Math.random() > 1.0 - 1.0 / 5000) {
                self.show = true;
            }
            if (Math.random() > 1.0 - 1.0 / 15) {
                self.show = false;
            }
        };
        return _this;
    }
    MagicImage.prototype.sendStatus = function () {
        var _this = this;
        this.network.massage.p = [
            gameWorld.camera.position.x,
            gameWorld.camera.position.y,
            gameWorld.camera.position.z
        ];
        this.network.massage.r = [
            gameWorld.camera.front.x,
            gameWorld.camera.front.y,
            gameWorld.camera.front.z
        ];
        this.network.massage.n = this.network.owner;
        this.network.post(function (s) {
            _this.renderObj(JSON.parse(s));
        });
        this.network.massage.a = [];
    };
    MagicImage.prototype.renderObj = function (otherList) {
        var _this = this;
        for (var i in this.playerObjPool) {
            this.playerObjPool[i].mark = false;
        }
        var getFromLocal = function (name) {
            for (var i in _this.playerObjPool) {
                if (_this.playerObjPool[i].name == name) {
                    _this.playerObjPool[i].mark = true;
                    return _this.playerObjPool[i];
                }
            }
            return null;
        };
        for (var i = 0; i < otherList.length; i++) {
            var netOne = otherList[i];
            var localOne = getFromLocal(netOne.n);
            if (localOne) {
                localOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2]);
                localOne.name = netOne.n;
                localOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2]);
                localOne.nameBoard.active = true;
            }
            else {
                var newOne = getFromLocal('');
                newOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2]);
                newOne.name = netOne.n;
                newOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2]);
                newOne.active = true;
                newOne.mark = true;
                newOne.nameBoard.active = true;
                newOne.nameBoard.refreshNameText();
                console.log("".concat(newOne.name, "\u52A0\u5165\u6E38\u620F"));
            }
        }
        for (var i in this.playerObjPool) {
            if (!this.playerObjPool[i].mark) {
                this.playerObjPool[i].name = '';
                this.playerObjPool[i].active = false;
                this.playerObjPool[i].nameBoard.active = false;
            }
        }
    };
    return MagicImage;
}(GameObject));
var OtherPlayer = /** @class */ (function (_super) {
    __extends(OtherPlayer, _super);
    function OtherPlayer() {
        var _this = _super.call(this) || this;
        _this.netPosition = glm.vec3(0., 3., 0.);
        _this.netFront = glm.vec3(0., 0., -1.);
        _this.front = glm.vec3(0., 0., -1.);
        _this.nameBoard = null;
        _this.active = false;
        _this.name = '';
        _this.model = 'model_player0';
        _this.texture = 'texture_player0';
        _this.textureASM = 'texture_player0ASM';
        _this.textureAS = 'texture_player0AS';
        _this.textureNormals = 'texture_player0Normals';
        _this.textureEmission = 'texture_player0Emission';
        _this.scale = glm.vec3(2., 2., 2.);
        var t = 0;
        _this.perLogic = function (self, delta) {
            var lerp = function (a, b, c) {
                return a['*'](1 - c)['+'](b['*'](c));
            };
            self.position = lerp(self.position, self.netPosition, 0.3);
            self.front = lerp(self.front, self.netFront, 0.3);
            self.front = glm.normalize(self.front);
            var front2 = glm.vec2(self.front.x, self.front.z);
            self.rotation.y = Math.atan2(-front2.x, -front2.y);
            self.rotation.x = Math.atan2(self.front.y, glm.length(front2));
        };
        return _this;
    }
    return OtherPlayer;
}(GameObject));
var NameBoard = /** @class */ (function (_super) {
    __extends(NameBoard, _super);
    function NameBoard() {
        var _this = _super.call(this) || this;
        _this.target = null;
        _this.ts = [];
        _this.model = 'model_text';
        _this.texture = 'texture_abc';
        _this.scale = glm.vec3(0.6, 1., 1.);
        var gl = tank.gameGL;
        var textProg = gl.createProgram();
        var vsdr = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vsdr, assets['shader_textVert']);
        gl.compileShader(vsdr);
        gl.attachShader(textProg, vsdr);
        var fsdr = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fsdr, assets['shader_textFrag']);
        gl.compileShader(fsdr);
        gl.attachShader(textProg, fsdr);
        gl.linkProgram(textProg);
        console.log(gl.getProgramInfoLog(textProg));
        _this.shaderProgram = textProg;
        _this.perLogic = function (self, delta) {
            self.position = _this.target.position['+'](glm.vec3(0., 2., 0.));
            var diff = gameWorld.camera.position['+'](glm.vec3(0., -0.8, 0.))['-'](self.position);
            self.rotation.y = Math.atan2(-diff.x, -diff.z);
        };
        _this.perFrame = function (self, ngl, delta, shadow) {
            if (!shadow) {
                ngl.uniform1iv(ngl.getUniformLocation(textProg, 'text'), new Int32Array(self.ts));
            }
        };
        return _this;
    }
    NameBoard.prototype.refreshNameText = function () {
        var l = 0;
        var n = this.target.name.substring(0, this.target.name.indexOf('>>$<<'));
        var r = 8;
        if (n.length == 0) {
            n = '没有名字的人';
        }
        if (n.length < 8) {
            l = Math.floor((8 - n.length) / 2);
            r = l + n.length;
        }
        this.ts = [];
        for (var i = 0; i < 8; i++) {
            this.ts.push(-1);
            if (i >= l && i < r) {
                var c = n.charAt(i - l).charCodeAt(0);
                console.log(c + '  ' + n);
                var idxa = 'a'.charCodeAt(0);
                var idxz = 'z'.charCodeAt(0);
                var idxA = 'A'.charCodeAt(0);
                var idxZ = 'Z'.charCodeAt(0);
                var idx0 = '0'.charCodeAt(0);
                var idx9 = '9'.charCodeAt(0);
                var idx = 36;
                if (c >= idxa && c <= idxz)
                    idx = c - idxa;
                if (c >= idxA && c <= idxZ)
                    idx = c - idxA;
                if (c >= idx0 && c <= idx9)
                    idx = c - idx0 + 26;
                this.ts[i] = idx;
            }
        }
    };
    return NameBoard;
}(GameObject));
function gameConfig1() {
    var tmp = new MagicImage();
    gameWorld.Objects.push(tmp);
    var oplist = [];
    for (var i = 0; i < 16; i++) {
        var op = new OtherPlayer();
        var nb = new NameBoard();
        nb.target = op;
        op.nameBoard = nb;
        oplist.push(op);
        gameWorld.Objects.push(op);
        gameWorld.Objects.push(nb);
    }
    tmp.playerObjPool = oplist;
}
