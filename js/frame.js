/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
/// <reference path="./renderWorld.ts" />
/// <reference path="./tbn.ts" />
var tank;
(function (tank) {
    tank.displayFuncs = [];
    tank.deltaTime = 60;
    tank.gameTime = 0;
    function main() {
        tank.canvas = document.createElement('canvas');
        tank.canvas.className = 'gameCanvas';
        document.body.appendChild(tank.canvas);
        tank.canvas.addEventListener('click', function (ev) {
            this.requestFullscreen();
            this.requestPointerLock();
        });
        tank.canvas.addEventListener('mousemove', function (ev) {
            tank.mouseXNoLimit += ev.movementX;
            tank.mouseYNoLimit += ev.movementY;
        });
        var request = new XMLHttpRequest();
        request.addEventListener('load', function (ev) {
            if (request.status == 200) {
                var data = JSON.parse(request.responseText);
                tank.canvas.width = data.canvasWidth;
                tank.canvas.height = data.canvasHeight;
                tank.deltaTime = data.deltaTime;
                console.log("Game info:\n    [".concat(data.canvasWidth, "x").concat(data.canvasHeight, "]\n    ").concat(tank.deltaTime, "ms per frame"));
            }
            else {
                console.log('Failed to read common config.');
            }
        });
        request.open('get', './config/default.json');
        request.send(null);
        return true;
    }
    tank.main = main;
    function loadShader(gl, code, type) {
        var sdr = gl.createShader(type);
        gl.shaderSource(sdr, code);
        gl.compileShader(sdr);
        console.log(gl.getShaderInfoLog(sdr));
        return sdr;
    }
    function loadTexture(texture, image, gl) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    function loadCubeMap(texture, image, gl) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[0]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[1]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[2]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[3]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[4]);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[5]);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    function gameInit() {
        var t = 0;
        tank.mouseXNoLimit = 0;
        tank.mouseYNoLimit = 0;
        var gl = tank.canvas.getContext('webgl2');
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.1, 0.2, 0.3, 1.);
        var mouse = [
            -1., 0., -2., 1.,
            1., 0., -2., 1.,
            0., 1., -2., 1.
        ];
        /*      LOAD TEST MODEL     */
        var findex = [];
        var model = JSON.parse(assets['model_tank']);
        genTBN(model);
        for (var fi = 0; fi < model.face.length; fi++) {
            for (var vi = 0; vi < model.face[fi].length; vi++) {
                findex.push(model.face[fi][vi]);
            }
            findex.push(Math.pow(2, 32) - 1);
        }
        /*      ---------------     */
        var prog = gl.createProgram();
        gl.attachShader(prog, loadShader(gl, assets['shader_tankVert'], gl.VERTEX_SHADER));
        gl.attachShader(prog, loadShader(gl, assets['shader_tankFrag'], gl.FRAGMENT_SHADER));
        gl.linkProgram(prog);
        console.log(gl.getProgramInfoLog(prog));
        var progSky = gl.createProgram();
        gl.attachShader(progSky, loadShader(gl, assets['shader_skyVert'], gl.VERTEX_SHADER));
        gl.attachShader(progSky, loadShader(gl, assets['shader_skyFrag'], gl.FRAGMENT_SHADER));
        gl.linkProgram(progSky);
        console.log(gl.getProgramInfoLog(progSky));
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertex), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'pos'));
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'uv'));
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'normal'));
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'tangent'));
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'bitangent'));
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'pos'), 3, gl.FLOAT, false, 14 * 4, 0);
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'uv'), 2, gl.FLOAT, false, 14 * 4, 3 * 4);
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'normal'), 3, gl.FLOAT, false, 14 * 4, 5 * 4);
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'tangent'), 3, gl.FLOAT, false, 14 * 4, 8 * 4);
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'bitangent'), 3, gl.FLOAT, false, 14 * 4, 11 * 4);
        var eidx = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eidx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(findex), gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        var skyvao = gl.createVertexArray();
        gl.bindVertexArray(skyvao);
        var skyVertexs = [
            -1., -1., -0.5,
            -1., 1., -0.5,
            1., 1., -0.5,
            1., -1., -0.5
        ];
        var skyvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, skyvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyVertexs), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(gl.getAttribLocation(progSky, 'pos'));
        gl.vertexAttribPointer(gl.getAttribLocation(progSky, 'pos'), 3, gl.FLOAT, false, 4 * 3, 0);
        gl.bindVertexArray(null);
        var albedo = gl.createTexture();
        loadTexture(albedo, assets['texture_tank'], gl);
        var ao = gl.createTexture();
        loadTexture(ao, assets['texture_tankAO'], gl);
        var asm = gl.createTexture();
        loadTexture(asm, assets['texture_tankASM'], gl);
        var bump = gl.createTexture();
        loadTexture(bump, assets['texture_normal'], gl);
        var sky = gl.createTexture();
        loadCubeMap(sky, [
            assets['texture_skyb0'],
            assets['texture_skyb1'],
            assets['texture_skyb2'],
            assets['texture_skyb3'],
            assets['texture_skyb4'],
            assets['texture_skyb5']
        ], gl);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        tank.displayFuncs.push(function (delta) {
            var perspective = glm.perspective(glm.radians(65), tank.canvas.width / tank.canvas.height, 0.01, 1000);
            gl.viewport(0, 0, tank.canvas.width, tank.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var viewMatrix = gameWorld.getCameraMatrix();
            var light = assets['config_render'];
            var sunDir = glm.vec3(light['sunDir'][0], light['sunDir'][1], light['sunDir'][2]);
            sunDir = viewMatrix['*'](glm.vec4(glm.normalize(sunDir), 0.));
            gl.useProgram(progSky);
            gl.bindVertexArray(skyvao);
            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'inPerspective'), false, glm.inverse(perspective).array);
            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'perspective'), false, perspective.array);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky);
            gl.uniform1i(gl.getUniformLocation(progSky, 'skyMap'), 2);
            gl.uniform1f(gl.getUniformLocation(progSky, 'time'), tank.gameTime);
            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'viewMatrix'), false, viewMatrix.array);
            gl.uniform3f(gl.getUniformLocation(progSky, 'sunDir'), sunDir.x, sunDir.y, sunDir.z);
            gl.uniform3f(gl.getUniformLocation(progSky, 'sunCol'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2]);
            gl.disable(gl.CULL_FACE);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.useProgram(prog);
            gl.bindVertexArray(vao);
            gl.uniform2f(gl.getUniformLocation(prog, 'mpos'), tank.mouseXNoLimit, tank.mouseYNoLimit);
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspective'), false, perspective.array);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, albedo);
            gl.uniform1i(gl.getUniformLocation(prog, 'albedo'), 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, ao);
            gl.uniform1i(gl.getUniformLocation(prog, 'ao'), 1);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, asm);
            gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 2);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky);
            gl.uniform1i(gl.getUniformLocation(prog, 'skyMap'), 3);
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, bump);
            gl.uniform1i(gl.getUniformLocation(prog, 'normalMap'), 4);
            gl.uniform1f(gl.getUniformLocation(prog, 'time'), tank.gameTime);
            // --- light data ---
            gl.uniform3f(gl.getUniformLocation(prog, 'sunDir'), sunDir.x, sunDir.y, sunDir.z);
            gl.uniform3f(gl.getUniformLocation(prog, 'sunColor'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2]);
            gl.uniform3f(gl.getUniformLocation(prog, 'envColor'), light['envColor'][0], light['envColor'][1], light['envColor'][2]);
            gl.uniform1f(gl.getUniformLocation(prog, 'envForce'), light['envForce']);
            gl.uniform1f(gl.getUniformLocation(prog, 'sunForce'), light['sunForce']);
            gl.clearColor(light['envColor'][0] * light['envForce'], light['envColor'][1] * light['envForce'], light['envColor'][2] * light['envForce'], 1.);
            // ------------------
            t += 0.;
            var rotateY = glm.mat4(Math.cos(t), 0., Math.sin(t), 0., 0., 1., 0., 0., -Math.sin(t), 0., Math.cos(t), 0., 0., 0., 0., 1.);
            var rotateX = glm.mat4(1., 0., 0., 0., 0., Math.cos(t / 4.), -Math.sin(t / 4.), 0., 0., Math.sin(t / 4.), Math.cos(t / 4.), 0., 0., 0., 0., 1.);
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'rotate'), false, rotateY['*'](rotateX).array);
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'viewMatrix'), false, viewMatrix.array);
            gl.enable(gl.CULL_FACE);
            gl.drawElements(gl.TRIANGLE_FAN, findex.length, gl.UNSIGNED_INT, 0);
            // gl.flush()
            gl.bindVertexArray(null);
        });
    }
    tank.gameInit = gameInit;
    function startGame() {
        var lastTime = 0;
        var update = function (time) {
            tank.gameTime = time;
            for (var i = 0; i < tank.displayFuncs.length; i++) {
                tank.displayFuncs[i]((time - lastTime) / 1000);
                lastTime = time;
            }
            window.requestAnimationFrame(update);
        };
        window.requestAnimationFrame(update);
        console.log(glm.vec4(3, 7, 9, 2));
    }
    tank.startGame = startGame;
})(tank || (tank = {}));
