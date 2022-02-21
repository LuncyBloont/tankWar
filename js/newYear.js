/// <reference path="./playerConfig.ts" />
/// <reference path="./frame.ts" />
/// <reference path="./gameLogic.ts" />
/// <reference path="./renderWorld.ts" />
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
var magicMaxTime = 20 * 1000;
var GameAction = /** @class */ (function () {
    function GameAction() {
        this.n = '';
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
var colorRule = [
    [1, 0.4, 0.2], [1, 0.9, 0.1], [0.5, 0.9, 0.6], [0.3, 0.8, 1], [0.7, 1, 0.3], [0.2, 0.9, 1]
];
var FirecrackerEffect = /** @class */ (function (_super) {
    __extends(FirecrackerEffect, _super);
    function FirecrackerEffect() {
        var _this = _super.call(this) || this;
        _this.speed = 3;
        _this.acceleration = 0.7;
        _this.speed_k = 0;
        _this.color = glm.vec3(1.0, 0.8, 0.3);
        _this.light = 0;
        _this.startTime = 0;
        _this.radius = 16;
        _this.lightPower = 445;
        _this.lightPowerChange = 115;
        _this.randomColor = true;
        _this.emission = 1;
        _this.color = glm.vec3(1, 1, 1);
        _this.texColor = glm.vec3(_this.color);
        _this.model = 'model_feffect';
        _this.texture = 'texture_red';
        _this.textureASM = 'texture_red';
        _this.textureNormals = 'texture_normal';
        _this.textureAS = 'texture_black';
        _this.textureEmission = 'texture_fEmission';
        _this.active = false;
        var boom = false;
        _this.perLogic = function (self, delta) {
            self.scale['+='](glm.vec3(self.speed_k * delta / 1000));
            self.speed_k -= self.acceleration * delta / 1000;
            var l = gameWorld.getLight(self.light);
            l.position = glm.vec3(self.position);
            l.power = (self.lightPower + Math.cos(localTime() - self.startTime * 0.00074) * self.lightPowerChange) * Math.pow(self.speed_k / self.speed, 3);
            l.rgb = glm.vec3(self.color);
            self.alpha = Math.pow(self.speed_k / self.speed, 0.8);
            self.emission = Math.pow(self.speed_k / self.speed, 0.7) * 2;
            if (glm.distance(self.position, gameWorld.camera.position) < _this.radius && !boom) {
                var to = gameWorld.camera.position['-'](self.position['-'](glm.vec3(0, 2, 0)));
                cvelocity['+='](glm.normalize(to)['*'](59925 / Math.pow(glm.length(to), 2)));
                var s = '<span style="color: #898989">我被击中了 QAQ </span>';
                player.messageList.push(s);
                tank.gameLog(s, '你', 'FFAA23');
            }
            if (!boom)
                boom = true;
            if (self.speed_k < 0) {
                _this.active = false;
                l.power = 0;
                boom = false;
            }
        };
        return _this;
    }
    return FirecrackerEffect;
}(GameObject));
var BoomEffect = /** @class */ (function (_super) {
    __extends(BoomEffect, _super);
    function BoomEffect() {
        var _this = _super.call(this) || this;
        _this.lightPower = 233;
        _this.lightPowerChange = 33;
        _this.speed = 3;
        _this.acceleration = 6;
        _this.color = glm.vec3(1., 0.9, 0.7);
        _this.model = 'model_boomRound';
        _this.textureEmission = 'texture_boomRound';
        return _this;
    }
    return BoomEffect;
}(FirecrackerEffect));
var NewYearBall = /** @class */ (function (_super) {
    __extends(NewYearBall, _super);
    function NewYearBall(pid) {
        var _this = _super.call(this) || this;
        _this.fireTime = 5;
        _this.startTime = -1;
        _this.startPosition = glm.vec3(0, 0, 0);
        _this.startRotation = glm.vec3(0, 0, 0);
        _this.audio1NameL = 'audio_readyLeft';
        _this.audio1NameR = 'audio_readyRight';
        _this.audio2NameL = 'audio_boomLeft';
        _this.audio2NameR = 'audio_boomRight';
        _this.poolID = -1;
        _this.P = function (spos, time) {
            return spos['+'](glm.vec3(0, time < 3 ? 0 : 0.5 * 36 * Math.pow(time - 3, 2), 0));
        };
        _this.R = function (srot, time) {
            return srot['+'](glm.vec3(0, time < 3 ? 0 : 0.5 * 26 * Math.pow(time - 3, 2), 0));
        };
        _this.toogle = function () { return false; };
        _this.feffect = new FirecrackerEffect();
        _this.poolID = pid;
        _this.texture = 'texture_firecracker0';
        _this.textureASM = 'texture_firecracker0ASM';
        _this.textureAS = 'texture_firecracker0AS';
        _this.textureNormals = 'texture_firecracker0Normals';
        _this.textureEmission = 'texture_firecracker0Emisson';
        _this.model = 'model_firecracker0';
        _this.aqueue = new AudioQueue(1, _this.audio2NameL, _this.audio2NameR);
        _this.queue2 = new AudioQueue(2, _this.audio1NameL, _this.audio1NameR);
        var audiok = -1;
        var audiok2 = -1;
        _this.perLogic = function (self, delta) {
            var t = (localTime() - self.startTime) / 1000;
            self.position = self.P(self.startPosition, t);
            self.rotation = self.R(self.startRotation, t);
            if (t < 3) {
                if (audiok < 0 || self.queue2.fixPosition(audiok, self.position, 0.4)) {
                    audiok = self.queue2.play(self.position, 0.4);
                }
            }
            else {
                if (audiok2 < 0) {
                    audiok2 = self.queue2.play(self.position, 3);
                }
                if (audiok2 >= 0) {
                    self.queue2.fixPosition(audiok2, self.position, 3);
                }
            }
            if (t > self.fireTime || self.toogle(self, delta)) {
                self.active = false;
                var fe = self.feffect;
                fe.active = true;
                fe.position = glm.vec3(self.position);
                fe.speed_k = fe.speed;
                fe.light = gameWorld.newLight(fe);
                fe.startTime = localTime();
                fe.scale = glm.vec3(2);
                fe.rotation = glm.vec3(self.rotation);
                if (fe.randomColor) {
                    var col = colorRule[self.startTime % colorRule.length];
                    fe.color = glm.vec3(col[0], col[1], col[2]);
                    fe.texColor = glm.vec3(col[0], col[1], col[2]);
                }
                self.aqueue.play(self.position, 600);
            }
        };
        return _this;
    }
    return NewYearBall;
}(GameObject));
var Fire1Ball = /** @class */ (function (_super) {
    __extends(Fire1Ball, _super);
    function Fire1Ball(idx) {
        var _this = _super.call(this, idx) || this;
        _this.model = 'model_firecracker3';
        _this.texture = 'texture_firecracker3';
        _this.textureASM = 'texture_firecracker3ASM';
        _this.textureAS = 'texture_firecracker3AS';
        _this.textureNormals = 'texture_firecracker3Normals';
        _this.textureEmission = 'texture_black';
        _this.feffect = new BoomEffect();
        _this.P = function (spos, time) {
            var to = glm.vec3(0, 0, -1);
            to = gameWorld.rotateVec3(to, _this.startRotation);
            return spos['+'](to['*'](Math.pow(time * 0.2, 2) * 6 + 26 * time))['+'](glm.vec3(0, -1, 0)['*'](Math.pow(3 * time, 2) * 0.5));
        };
        _this.R = function (srot, time) {
            return glm.vec3(srot.x, srot.y, srot.z + Math.pow(time, 2) * 4 + time * 2);
        };
        _this.toogle = function (self, delta) {
            var h = getHeight(self.position.x, self.position.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight);
            if (h >= self.position.y - 1) {
                // self.position.y = h + 1
                return true;
            }
            return false;
        };
        return _this;
    }
    return Fire1Ball;
}(NewYearBall));
var AtomPool = /** @class */ (function () {
    function AtomPool(count, pmint, key, create, genP, genR) {
        this.pool = [];
        this.sid = 0;
        this.putTime = 0;
        this.putMinTime = 2;
        this.acKey = 'x';
        this.putMinTime = pmint;
        this.acKey = key;
        this.creator = create;
        for (var i = 0; i < count; i++) {
            this.pool.push(this.creator(i));
        }
        this.genPos = genP;
        this.genRot = genR;
    }
    AtomPool.prototype.activeOne = function (pos, rot, time) {
        this.sid = (this.sid + 1) % this.pool.length;
        var o = this.pool[this.sid];
        o.active = true;
        o.startPosition = pos;
        o.startRotation = rot;
        o.startTime = time;
    };
    return AtomPool;
}());
var MagicImage = /** @class */ (function (_super) {
    __extends(MagicImage, _super);
    function MagicImage() {
        var _this = _super.call(this) || this;
        _this.willCaching = false;
        _this.timeToPost = 1000.;
        _this.network = new NetworkStatus();
        _this.playerObjPool = [];
        _this.lastTime = 0;
        _this.lock = 0;
        _this.pool = [];
        _this.position = glm.vec3(4., 0., 10.);
        _this.network.massage = new TransBase();
        _this.network.owner = player.playerID;
        _this.model = 'model_netFace';
        _this.texture = 'texture_face0';
        _this.textureASM = 'texture_face0ASM';
        _this.textureAS = 'texture_face0AS';
        _this.textureNormals = 'texture_face0Normals';
        _this.show = false;
        _this.pool.push(new AtomPool(32, 1, '1', function (i) { return new NewYearBall(i); }, function () {
            var front = glm.normalize(glm.vec2(gameWorld.camera.front.x, gameWorld.camera.front.z));
            var pos = gameWorld.camera.position['+'](glm.vec3(front.x, 0, front.y)['*'](4));
            pos.y = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight);
            return pos;
        }, function () {
            var rot = glm.vec3(0, Math.atan2(gameWorld.camera.front.x, gameWorld.camera.front.z), 0);
            return rot;
        }));
        _this.pool.push(new AtomPool(32, 2, '2', function (i) { return new Fire1Ball(i); }, function () {
            return gameWorld.camera.position['+'](gameWorld.camera.front['*'](2));
        }, function () {
            return gameWorld.camera.readOnlyRotation;
        }));
        _this.preGame = function (self, gl) {
            self.light = gameWorld.newLight(self);
            gameWorld.getLight(self.light).rgb = glm.vec3(0.97, 0.34, 0.56);
            gameWorld.getLight(self.light).power = 5.0;
        };
        _this.perLogic = function (self, delta) {
            if (gameWorld.getLightHost(self.light) != self) {
                self.light = gameWorld.newLight(self);
                gameWorld.getLight(self.light).rgb = glm.vec3(0.97, 0.34, 0.56);
                gameWorld.getLight(self.light).power = 5.0;
            }
            gameWorld.getLight(self.light).position = glm.vec3(self.position);
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
            // ############################### weapon logic ######################################
            (function () {
                for (var i = 0; i < self.pool.length; i++) {
                    self.pool[i].putTime += delta / 1000;
                    if (self.pool[i].putTime > self.pool[i].putMinTime)
                        self.pool[i].putTime = self.pool[i].putMinTime;
                    if (gameEvent[self.pool[i].acKey] && self.pool[i].putTime >= self.pool[i].putMinTime) {
                        self.pool[i].putTime = 0;
                        var t = localTime();
                        var pos = self.pool[i].genPos();
                        var rot = self.pool[i].genRot();
                        /*let front = glm.normalize(glm.vec2(gameWorld.camera.front.x, gameWorld.camera.front.z))
                        let pos = gameWorld.camera.position['+'](
                            glm.vec3(front.x, 0, front.y)['*'](4)
                        )
                        pos.y = getHeight(pos.x, pos.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight)
                        let rot = glm.vec3(0, Math.atan2(diff.x, diff.z), 0)*/
                        self.pool[i].activeOne(pos, rot, t);
                        var a = new GameAction();
                        a.p = [pos.x, pos.y, pos.z];
                        a.r = [rot.x, rot.y, rot.z];
                        a.t = t;
                        a.n = 'weap:' + i;
                        self.network.massage.a.push(a);
                    }
                }
            })();
            // ############################### weapon logic END ######################################
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
        if (new Date().getTime() - this.lock < magicMaxTime) {
            return;
        }
        for (var i = 0; i < player.messageList.length; i++) {
            var ac = new GameAction();
            ac.n = 'msg:' + player.messageList[i];
            ac.p = [0, 0, 0];
            ac.r = [0, 0, 0];
            ac.t = localTime();
            this.network.massage.a.push(ac);
        }
        player.messageList.splice(0, player.messageList.length);
        var safeAction = this.network.massage.a;
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
            var bag = s;
            if (bag.time >= _this.lastTime) {
                _this.renderObj(bag.list, false);
                _this.lastTime = bag.time;
            }
            else {
                _this.renderObj(bag.list, true);
            }
            _this.lock = 0;
        }, function () {
            for (var i in _this.network.massage.a) {
                safeAction.push(_this.network.massage.a[i]);
            }
            _this.network.massage.a = safeAction;
            _this.lock = 0;
        });
        this.network.massage.a = [];
        this.lock = new Date().getTime();
    };
    MagicImage.prototype.compareAction = function (old, newo) {
        if (old.length != newo.length)
            return false;
        for (var i = 0; i < old.length; i++) {
            var a = old[i];
            var b = newo[i];
            if (a.n != b.n)
                return false;
            if (a.t != b.t)
                return false;
            if (a.p[0] != b.p[0] || a.p[1] != b.p[1] || a.p[2] != b.p[2])
                return false;
            if (a.r[0] != b.r[0] || a.r[1] != b.r[1] || a.r[2] != b.r[2])
                return false;
        }
        return true;
    };
    MagicImage.prototype.renderObj = function (otherList, old) {
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
                if (!old) {
                    localOne.netPosition = glm.vec3(netOne.p[0], netOne.p[1], netOne.p[2]);
                    localOne.name = netOne.n;
                    localOne.netFront = glm.vec3(netOne.r[0], netOne.r[1], netOne.r[2]);
                }
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
                tank.gameLog("".concat(netOne.n.substring(0, netOne.n.indexOf('>>$<<')), "\u52A0\u5165\u6E38\u620F"), '系统', SYSColor);
                localOne = newOne;
            }
            if (!this.compareAction(localOne.oldAction, netOne.a)) {
                for (var j = 0; j < netOne.a.length; j++) {
                    var action = netOne.a[i];
                    if (action.n.indexOf('weap:') == 0) {
                        var ki = parseInt(action.n.substring(5, action.n.length));
                        this.pool[ki].activeOne(glm.vec3(action.p[0], action.p[1], action.p[2]), glm.vec3(action.r[0], action.r[1], action.r[2]), action.t);
                    }
                    else if (action.n.indexOf('msg:') == 0) {
                        tank.gameLog(action.n.substring(4, action.n.length), netOne.n.substring(0, netOne.n.indexOf('>>$<<')), 'FFAAEE');
                    }
                }
                localOne.oldAction = netOne.a;
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
        _this.size = 4;
        _this.oldAction = [];
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
            self.position = lerp(self.position, self.netPosition, 0.15);
            self.front = lerp(self.front, self.netFront, 0.15);
            self.front = glm.normalize(self.front);
            var front2 = glm.vec2(self.front.x, self.front.z);
            self.rotation.y = Math.atan2(-front2.x, -front2.y);
            self.rotation.x = Math.atan2(self.front.y, glm.length(front2));
            var dis = glm.distance(self.position, gameWorld.camera.position);
            if (dis < self.size) {
                cvelocity['-='](glm.normalize(self.position['-'](gameWorld.camera.position))['*']((self.size - dis) * 12));
                if (gameWorld.camera.position.y - self.position.y > self.size / 2) {
                    conGround = true;
                }
            }
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
        _this.shaderProgram = textProg;
        _this.shadow = false;
        _this.perLogic = function (self, delta) {
            self.position = _this.target.position['+'](glm.vec3(0., 2., 0.));
            var diff = gameWorld.camera.position['+'](glm.vec3(0., -0.8, 0.))['-'](self.position);
            self.rotation.y = Math.atan2(-diff.x, -diff.z);
        };
        _this.perFrame = function (self, ngl, delta, shadow) {
            if (!shadow && self.ts.length > 0) {
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
function mapInit() {
    var tmp = new GameObject();
    tmp.model = 'model_mapBeach';
    tmp.texture = 'texture_mapBeach';
    tmp.textureASM = 'texture_mapBeachASM';
    tmp.textureAS = 'texture_mapBeachAS';
    tmp.textureNormals = 'texture_mapBeachNormals';
    tmp.perLogic = function (self, delta) { };
    tmp.noiseSize = 8096;
    tmp.noiseForce = 0.05;
    gameWorld.objects.push(tmp);
    tmp = new GameObject();
    tmp.model = 'model_mapColl';
    tmp.texture = 'texture_mapColl';
    tmp.textureASM = 'texture_mapCollASM';
    tmp.textureAS = 'texture_mapCollAS';
    tmp.textureNormals = 'texture_mapCollNormals';
    tmp.perLogic = function (self, delta) { };
    tmp.noiseSize = 2048;
    tmp.noiseForce = 0.12;
    gameWorld.objects.push(tmp);
    tmp = new GameObject();
    tmp.model = 'model_mapCover';
    tmp.texture = 'texture_mapCover';
    tmp.textureASM = 'texture_mapCoverASM';
    tmp.textureAS = 'texture_mapCoverAS';
    tmp.textureNormals = 'texture_mapCoverNormals';
    tmp.perLogic = function (self, delta) { };
    tmp.noiseSize = 2038;
    tmp.noiseForce = 0.2;
    gameWorld.objects.push(tmp);
    tmp = new GameObject();
    tmp.model = 'model_mapPlants';
    tmp.texture = 'texture_mapPlants';
    tmp.textureASM = 'texture_mapPlantsASM';
    tmp.textureAS = 'texture_mapPlantsAS';
    tmp.textureNormals = 'texture_mapPlantsNormals';
    tmp.perLogic = function (self, delta) { };
    tmp.noiseSize = 1024;
    tmp.noiseForce = 0.1;
    gameWorld.objects.push(tmp);
}
function gameConfig1() {
    mapInit();
    var tmp = new MagicImage();
    gameWorld.objects.push(tmp);
    var oplist = [];
    for (var i = 0; i < 16; i++) {
        var op = new OtherPlayer();
        var nb = new NameBoard();
        nb.target = op;
        op.nameBoard = nb;
        oplist.push(op);
        gameWorld.objects.push(op);
        gameWorld.objects.push(nb);
    }
    tmp.playerObjPool = oplist;
    var tmp2 = new GameObject();
    tmp2.position = glm.vec3(38, 23, -59);
    var old = tmp2.perLogic;
    tmp2.perLogic = function (self, delta) {
        old(self, delta);
        self.position.y = getHeight(self.position.x, self.position.z, 'map_mapCollision', gMapCenter, gMapScale, gMapZMin, gMapZMax, gMapWidth, gMapHeight) + 3;
    };
    gameWorld.objects.push(tmp2);
    for (var pi = 0; pi < tmp.pool.length; pi++) {
        for (var i = 0; i < tmp.pool[pi].pool.length; i++) {
            tmp.pool[pi].pool[i].active = false;
            gameWorld.objects.push(tmp.pool[pi].pool[i]);
            gameWorld.objects.push(tmp.pool[pi].pool[i].feffect);
        }
    }
}
