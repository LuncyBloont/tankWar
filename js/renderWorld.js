/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
/// <reference path="./tbn.ts" />
var GameObject = /** @class */ (function () {
    function GameObject() {
        this.active = true;
        this.show = true;
        this.name = 'default';
        this.position = glm.vec3(0., 0., 0.);
        this.rotation = glm.vec3(0., 0., 0.);
        this.scale = glm.vec3(1., 1., 1.);
        this.model = 'model_docter';
        this.texture = 'texture_kiki';
        this.textureASM = 'texture_kikiASM';
        this.textureAS = 'texture_kikiAS';
        this.textureNormals = 'texture_kikiNormals';
        this.textureEmission = 'texture_black';
        this.emission = 1;
        this.alpha = 1;
        this.texColor = glm.vec3(1, 1, 1);
        this.shaderProgram = null;
        this.shadow = true;
        this.noiseSize = 1024;
        this.noiseForce = 0;
        this.backenPointLight = [false, false, false, false, false, false, false, false];
        this.perFrame = function (self, gl, delta, shadow) { };
        this.perLogic = function (self, delta) {
            self.rotation.y += delta * 0.0008;
        };
        this.preGame = function (self, gl) { };
    }
    return GameObject;
}());
var Light = /** @class */ (function () {
    function Light() {
        this.position = glm.vec3(0, 0, 0);
        this.rgb = glm.vec3(0, 0, 0);
        this.power = 0;
    }
    return Light;
}());
var Heap = /** @class */ (function () {
    function Heap(count, compare, max) {
        this.array = [];
        this.size = 0;
        this.array = new Array(count + 1);
        this.max = max;
        for (var i = 0; i < count + 1; i++) {
            this.array[i] = max;
        }
        this.compare = compare;
    }
    Heap.prototype.getLeft = function (ix) {
        var c = ix * 2;
        return c < this.array.length ? c : -1;
    };
    Heap.prototype.getRight = function (ix) {
        var c = ix * 2 + 1;
        return c < this.array.length ? c : -1;
    };
    Heap.prototype.getPre = function (ix) {
        var c = Math.floor(ix / 2);
        return c;
    };
    Heap.prototype.clean = function () {
        for (var i = 0; i < this.array.length; i++) {
            this.array[i] = this.max;
        }
    };
    Heap.prototype.docom = function (a, b) {
        if (a == this.max)
            return false;
        if (b == this.max)
            return true;
        if (this.compare(a, b))
            return true;
        else
            return false;
    };
    Heap.prototype.insert = function (a) {
        if (this.size + 1 < this.array.length) {
            var ix = this.size + 1;
            this.size += 1;
            this.array[ix] = a;
            while (true) {
                if (ix <= 1)
                    return true;
                var p = this.getPre(ix);
                if (this.docom(this.array[ix], this.array[p])) {
                    var ex = this.array[ix];
                    this.array[ix] = this.array[p];
                    this.array[p] = ex;
                    ix = p;
                }
                else {
                    return true;
                }
            }
        }
        return false;
    };
    Heap.prototype["delete"] = function () {
        if (this.size > 0) {
            this.size -= 1;
            var ix = 1;
            var res = this.array[1];
            this.array[1] = this.max;
            while (true) {
                var l = this.getLeft(ix);
                var r = this.getRight(ix);
                var up = ix;
                if (l < this.array.length && this.docom(this.array[l], this.array[up])) {
                    up = l;
                }
                if (r < this.array.length && this.docom(this.array[r], this.array[up])) {
                    up = r;
                }
                if (up == ix) {
                    return res;
                }
                var ex = this.array[ix];
                this.array[ix] = this.array[up];
                this.array[up] = ex;
                ix = up;
            }
        }
        return this.max;
    };
    Heap.prototype.top = function () {
        return this.array[1];
    };
    return Heap;
}());
var gameWorld;
(function (gameWorld) {
    gameWorld.camera = {
        position: glm.vec3(0., 15., 5.),
        front: glm.vec3(0., 0., -1.),
        right: glm.vec3(1., 0., 0.),
        up: glm.vec3(0., 1., 0.),
        readOnlyRotation: glm.vec3(0, 0, 0),
        fov: 65.
    };
    gameWorld.objects = [];
    var lights = [
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light()
    ];
    var lightMark = [
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false
    ];
    var lightHost = [
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null
    ];
    var lightCount = 32;
    function setLight(l, index) {
        if (index >= 0 && index < lightCount) {
            lights[index] = l;
        }
    }
    gameWorld.setLight = setLight;
    function getLight(index) {
        if (index >= 0 && index < lightCount) {
            return lights[index];
        }
    }
    gameWorld.getLight = getLight;
    function getLightHost(index) {
        return lightHost[index];
    }
    gameWorld.getLightHost = getLightHost;
    function newLight(host) {
        for (var i = 0; i < lightMark.length; i++) {
            if (!lightMark[i]) {
                lightMark[i] = true;
                lightHost[i] = host;
                return i;
            }
        }
        for (var i = 0; i < lightMark.length; i++) {
            if (lights[i].power <= 0 || lights[i].rgb.x <= 0 || lights[i].rgb.y <= 0 || lights[i].rgb.z <= 0) {
                lightHost[i] = host;
                lightMark[i] = true;
                return i;
            }
        }
        var min = 0;
        var minP = 1e9;
        for (var i = 0; i < lightMark.length; i++) {
            if (lights[i].power <= minP) {
                minP = lights[i].power;
                min = i;
            }
        }
        lightHost[min] = host;
        lightMark[min] = true;
        return min;
    }
    gameWorld.newLight = newLight;
    function deleteLight(index) {
        if (index < 0 || index >= lightCount) {
            return -1;
        }
        if (lightMark[index]) {
            lightMark[index] = false;
            return index;
        }
        else {
            return -1;
        }
    }
    gameWorld.deleteLight = deleteLight;
    var lightHeap = new Heap(64, function (a, b) {
        return a.power > b.power;
    }, null);
    function sortLight() {
        lightHeap.clean();
        for (var i = 0; i < lightCount; i++) {
            lightHeap.insert(lights[i]);
        }
    }
    gameWorld.sortLight = sortLight;
    function getArrayOfLight() {
        var arr = [];
        var arr2 = [];
        for (var i = 0; i < lightCount; i++) {
            var l = lightHeap["delete"]();
            arr.push(l.position.x);
            arr.push(l.position.y);
            arr.push(l.position.z);
            arr2.push(l.rgb.x * l.power);
            arr2.push(l.rgb.y * l.power);
            arr2.push(l.rgb.z * l.power);
        }
        return [new Float32Array(arr), new Float32Array(arr2)];
    }
    gameWorld.getArrayOfLight = getArrayOfLight;
    function fixCamera() {
        gameWorld.camera.front = glm.normalize(gameWorld.camera.front);
        gameWorld.camera.right = glm.normalize(glm.cross(gameWorld.camera.front, glm.vec3(0., 1., 0.)));
        gameWorld.camera.up = glm.cross(gameWorld.camera.right, gameWorld.camera.front);
        var rinxz = glm.vec2(-gameWorld.camera.front.z, -gameWorld.camera.front.x);
        gameWorld.camera.readOnlyRotation = glm.vec3(Math.atan2(gameWorld.camera.front.y, glm.length(rinxz)), Math.atan2(rinxz.y, rinxz.x), 0);
    }
    /**
     * Make the camera look at 'end' from 'start' in world space
     * @param start glm.vec3
     * @param end glm.vec3
     */
    function lookAt(start, end) {
        gameWorld.camera.position = start;
        gameWorld.camera.front = end['-'](start);
        fixCamera();
    }
    gameWorld.lookAt = lookAt;
    function setCameraAndDirection(pos, dir) {
        gameWorld.camera.position = pos;
        gameWorld.camera.front = dir;
        fixCamera();
    }
    gameWorld.setCameraAndDirection = setCameraAndDirection;
    function getCameraMatrix() {
        return glm.mat4(gameWorld.camera.right.x, gameWorld.camera.up.x, -gameWorld.camera.front.x, 0., gameWorld.camera.right.y, gameWorld.camera.up.y, -gameWorld.camera.front.y, 0., gameWorld.camera.right.z, gameWorld.camera.up.z, -gameWorld.camera.front.z, 0., 0., 0., 0., 1.)['*'](glm.mat4(1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., -gameWorld.camera.position.x, -gameWorld.camera.position.y, -gameWorld.camera.position.z, 1.));
    }
    gameWorld.getCameraMatrix = getCameraMatrix;
    function getShadowMatrix(sunDir, lwidth, lheight, twidth, theight, ldepth, offset) {
        var front = glm.normalize(sunDir);
        var right = glm.normalize(glm.cross(front, glm.vec3(0., 0., 1.)));
        var up = glm.cross(right, front);
        var m = glm.mat4(1 / lwidth / 2., 0., 0., 0., 0., 1 / lheight / 2., 0., 0., 0., 0., 1. / ldepth, 0., 0., 0., offset / ldepth, 1.)['*'](glm.mat4(right.x, up.x, front.x, 0., right.y, up.y, front.y, 0., right.z, up.z, front.z, 0., 0., 0., 0., 1.))['*'](glm.mat4(1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., -gameWorld.camera.position.x, -gameWorld.camera.position.y, -gameWorld.camera.position.z, 1.));
        return m;
    }
    gameWorld.getShadowMatrix = getShadowMatrix;
    function perpareOne(gl, program, gobj) {
        var model = JSON.parse(assets[gobj.model]);
        genTBN(model);
        console.log("G Object ".concat(gobj.name, " use ").concat(gobj.shaderProgram ? 'special' : 'common', " program."));
        gobj.shaderProgram = gobj.shaderProgram ? gobj.shaderProgram : program;
        gobj.vao = gl.createVertexArray();
        gobj.idOfTexture = gl.createTexture();
        gobj.idOfASTexture = gl.createTexture();
        gobj.idOfASMTexture = gl.createTexture();
        gobj.idOfNormalsMap = gl.createTexture();
        gobj.idOfEmissionTexture = gl.createTexture();
        gl.bindVertexArray(gobj.vao);
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertex), gl.STATIC_DRAW);
        gobj.findex = [];
        for (var fi = 0; fi < model.face.length; fi++) {
            for (var vi = 0; vi < model.face[fi].length; vi++) {
                gobj.findex.push(model.face[fi][vi]);
            }
            gobj.findex.push(Math.pow(2, 32) - 1);
        }
        gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'pos'));
        gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'pos'), 3, gl.FLOAT, false, 14 * 4, 0);
        if (gl.getAttribLocation(gobj.shaderProgram, 'uv') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'uv'));
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'uv'), 2, gl.FLOAT, false, 14 * 4, 3 * 4);
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'normal') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'normal'));
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'normal'), 3, gl.FLOAT, true, 14 * 4, 5 * 4);
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'tangent') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'tangent'));
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'tangent'), 3, gl.FLOAT, true, 14 * 4, 8 * 4);
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'bitangent') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'bitangent'));
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'bitangent'), 3, gl.FLOAT, true, 14 * 4, 11 * 4);
        }
        var ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(gobj.findex), gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        var linkTexture = function (texName, id) {
            gl.bindTexture(gl.TEXTURE_2D, id);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, assets[texName]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        linkTexture(gobj.texture, gobj.idOfTexture);
        linkTexture(gobj.textureAS, gobj.idOfASTexture);
        linkTexture(gobj.textureASM, gobj.idOfASMTexture);
        linkTexture(gobj.textureNormals, gobj.idOfNormalsMap);
        linkTexture(gobj.textureEmission, gobj.idOfEmissionTexture);
        gobj.preGame(gobj, gl);
    }
    gameWorld.perpareOne = perpareOne;
    function prepareObjexts(gl, program) {
        for (var i in gameWorld.objects) {
            var gobj = gameWorld.objects[i];
            perpareOne(gl, program, gobj);
        }
    }
    gameWorld.prepareObjexts = prepareObjexts;
    function rotateVec3(vec, rot) {
        var nv = glm.vec4(vec, 0);
        var res = rotateMat(rot)['*'](nv);
        return glm.vec3(res.x, res.y, res.z);
    }
    gameWorld.rotateVec3 = rotateVec3;
    function rotateMat(rot) {
        var cosx = Math.cos(rot.x), sinx = Math.sin(rot.x);
        var cosy = Math.cos(rot.y), siny = Math.sin(rot.y);
        var cosz = Math.cos(rot.z), sinz = Math.sin(rot.z);
        var r = glm.mat4(cosy, 0., -siny, 0., 0., 1., 0., 0., siny, 0., cosy, 0., 0., 0., 0., 1.)['*'](glm.mat4(1., 0., 0., 0., 0., cosx, sinx, 0., 0., -sinx, cosx, 0., 0., 0., 0., 1.))['*'](glm.mat4(cosz, sinz, 0., 0., -sinz, cosz, 0., 0., 0., 0., 1., 0., 0., 0., 0., 1.));
        return r;
    }
    gameWorld.rotateMat = rotateMat;
    function renderObjects(gl, delta, sky, time, light, viewMat, perspective, program, shadow, shadowMat, shadowMap) {
        var lightList;
        if (!shadow) {
            sortLight();
            lightList = getArrayOfLight();
        }
        for (var i in gameWorld.objects) {
            var gobj = gameWorld.objects[i];
            if (!gobj.active || !gobj.show || (shadow && !gobj.shadow))
                continue;
            var prog = program ? program : gobj.shaderProgram;
            gl.useProgram(prog);
            gl.bindVertexArray(gobj.vao);
            if (!shadow) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfTexture);
                gl.uniform1i(gl.getUniformLocation(prog, 'albedo'), 0);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASTexture);
                gl.uniform1i(gl.getUniformLocation(prog, 'tao'), 1);
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASMTexture);
                gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 2);
                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky);
                gl.uniform1i(gl.getUniformLocation(prog, 'skyMap'), 3);
                gl.activeTexture(gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfNormalsMap);
                gl.uniform1i(gl.getUniformLocation(prog, 'normalMap'), 4);
                gl.activeTexture(gl.TEXTURE5);
                gl.bindTexture(gl.TEXTURE_2D, shadowMap);
                gl.uniform1i(gl.getUniformLocation(prog, 'shadowMap'), 5);
                gl.activeTexture(gl.TEXTURE6);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfEmissionTexture);
                gl.uniform1i(gl.getUniformLocation(prog, 'emission'), 6);
                gl.uniform1f(gl.getUniformLocation(prog, 'time'), time);
                gl.uniform1f(gl.getUniformLocation(prog, 'noiseSize'), gobj.noiseSize);
                gl.uniform1f(gl.getUniformLocation(prog, 'noiseForce'), gobj.noiseForce);
                gl.uniform1f(gl.getUniformLocation(prog, 'sunForce'), light['sunForce']);
                gl.uniform1f(gl.getUniformLocation(prog, 'envForce'), light['envForce']);
                gl.uniform3f(gl.getUniformLocation(prog, 'sunColor'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2]);
                gl.uniform3f(gl.getUniformLocation(prog, 'envColor'), light['envColor'][0], light['envColor'][1], light['envColor'][2]);
                gl.uniform3fv(gl.getUniformLocation(prog, 'light'), lightList[0]);
                gl.uniform3fv(gl.getUniformLocation(prog, 'lightRGB'), lightList[1]);
                gl.uniform1f(gl.getUniformLocation(prog, 'emissionForce'), gobj.emission);
                gl.uniform1f(gl.getUniformLocation(prog, 'alpha'), gobj.alpha);
                gl.uniform3f(gl.getUniformLocation(prog, 'mainColor'), gobj.texColor.x, gobj.texColor.y, gobj.texColor.z);
            }
            else {
                gl.uniform1f(gl.getUniformLocation(prog, 'time'), time);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASMTexture);
                gl.uniform1f(gl.getUniformLocation(prog, 'alpha'), gobj.alpha);
                gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 0);
            }
            var trans = glm.mat4(1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., gobj.position.x, gobj.position.y, gobj.position.z, 1.)['*'](rotateMat(gobj.rotation))['*'](glm.mat4(gobj.scale.x, 0., 0., 0, 0., gobj.scale.y, 0., 0., 0., 0., gobj.scale.z, 0., 0., 0., 0., 1.));
            if (perspective && gl.getUniformLocation(prog, 'perspective') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspective'), false, perspective.array);
            }
            if (gl.getUniformLocation(prog, 'rotate') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'rotate'), false, trans.array);
            }
            if (gl.getUniformLocation(prog, 'inRotate') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'inRotate'), false, glm.inverse(trans).array);
            }
            if (viewMat && gl.getUniformLocation(prog, 'viewMatrix') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'viewMatrix'), false, viewMat.array);
            }
            if (shadowMat && gl.getUniformLocation(prog, 'perspectiveShadow') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspectiveShadow'), false, shadowMat.array);
            }
            gobj.perFrame(gobj, gl, delta, shadow);
            gl.drawElements(gl.TRIANGLE_FAN, gobj.findex.length, gl.UNSIGNED_INT, 0);
        }
    }
    gameWorld.renderObjects = renderObjects;
    function logicLoop(delta) {
        for (var i in gameWorld.objects) {
            var gobj = gameWorld.objects[i];
            if (!gobj.active)
                continue;
            gobj.perLogic(gobj, delta);
        }
    }
    gameWorld.logicLoop = logicLoop;
})(gameWorld || (gameWorld = {}));
