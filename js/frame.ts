/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
/// <reference path="./renderWorld.ts" />
/// <reference path="./tbn.ts" />
/// <reference path="./gameLogic.ts" />

namespace tank {
    const shadowSize = 1024
    export const displayFuncs: Array<Function> = []
    export let deltaTime: number = 60
    export let canvas: HTMLCanvasElement
    export let mouseXNoLimit: number, mouseYNoLimit: number

    export let gameTime = 0

    export let gameGL: WebGL2RenderingContext = null
    export let commonProgram: WebGLProgram = null

    export function main(): boolean {
        canvas = document.createElement('canvas')
        canvas.className = 'gameCanvas'
        document.body.appendChild(canvas)
        canvas.addEventListener('click', function (ev: MouseEvent) {
            this.requestFullscreen()
            this.requestPointerLock()
        })
        canvas.addEventListener('mousemove', function (ev: MouseEvent) {
            mouseXNoLimit += ev.movementX
            mouseYNoLimit += ev.movementY
        })

        const request = new XMLHttpRequest()
        request.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
            if (request.status == 200) {
                let data = JSON.parse(request.responseText)
                canvas.width = data.canvasWidth
                canvas.height = data.canvasHeight
                deltaTime = data.deltaTime
                console.log(`Game info:\n    [${data.canvasWidth}x${data.canvasHeight}]\n    ${deltaTime}ms per frame`)
            } else {
                console.log('Failed to read common config.')
            }
        })
        request.open('GET', './config/default.json')
        request.send(null)

        return true
    }

    function loadShader(gl: WebGL2RenderingContext, code: string, type: number): WebGLShader {
        const sdr = gl.createShader(type)
        gl.shaderSource(sdr, code)
        gl.compileShader(sdr)
        return sdr
    }

    function loadTexture(texture: WebGLTexture, image: HTMLImageElement, gl: WebGL2RenderingContext) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.bindTexture(gl.TEXTURE_2D, null)
    }

    function loadCubeMap(texture: WebGLTexture, image: HTMLImageElement[], gl: WebGL2RenderingContext) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[0])
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[1])
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[2])
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[3])
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[4])
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image[5])

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    }

    function renderShadow(gl: WebGL2RenderingContext, shadowP: WebGLProgram, light: any, 
        mapvao: WebGLVertexArrayObject, mapIndex: Array<number>, delta: number, mapRotate: any, shadowMat: any,
        frame: WebGLFramebuffer, asm: WebGLTexture) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, frame)
        gl.clearColor(1., 0., 0., 1.)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
        gl.viewport(0, 0, shadowSize, shadowSize)
        gl.useProgram(shadowP)

        gl.bindVertexArray(mapvao)

        gl.uniformMatrix4fv(gl.getUniformLocation(shadowP, 'perspectiveShadow'), false, shadowMat.array)
        gl.uniformMatrix4fv(gl.getUniformLocation(shadowP, 'rotate'), false, mapRotate.array)
        gl.uniform1f(gl.getUniformLocation(shadowP, 'time'), localTime())
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, asm)
        gl.uniform1i(gl.getUniformLocation(shadowP, 'tasm'), 0)

        gl.drawElements(gl.TRIANGLE_FAN, mapIndex.length, gl.UNSIGNED_INT, 0)

        gameWorld.renderObjects(gl, delta, null, gameTime, light, null, null, shadowP, true, null, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    export function gameInit() {
        let t = 0

        mouseXNoLimit = 0
        mouseYNoLimit = 0
        const gl = canvas.getContext('webgl2')
        gameGL = gl
        gl.enable(gl.DEPTH_TEST)
        gl.clearColor(0.1, 0.2, 0.3, 1.)

        const mouse: Array<number> = [
            -1., 0., -2., 1.,
            1., 0., -2., 1.,
            0., 1., -2., 1.
        ]

        /*      LOAD TEST MODEL     */
        const findex = []
        const model = JSON.parse(assets['model_tank'])
        genTBN(model)
        for (let fi = 0; fi < model.face.length; fi++) {
            for (let vi = 0; vi < model.face[fi].length; vi++) {
                findex.push(model.face[fi][vi])
            }
            findex.push(Math.pow(2, 32) - 1)
        }
        /*      ---------------     */

        const prog = gl.createProgram()
        gl.attachShader(prog, loadShader(gl, assets['shader_tankVert'], gl.VERTEX_SHADER))
        gl.attachShader(prog, loadShader(gl, assets['shader_tankFrag'], gl.FRAGMENT_SHADER))
        gl.linkProgram(prog)
        console.log(gl.getProgramInfoLog(prog))
        commonProgram = prog

        const shadowP = gl.createProgram()
        gl.attachShader(shadowP, loadShader(gl, assets['shader_shadowVert'], gl.VERTEX_SHADER))
        gl.attachShader(shadowP, loadShader(gl, assets['shader_shadowFrag'], gl.FRAGMENT_SHADER))
        gl.linkProgram(shadowP)
        console.log(gl.getProgramInfoLog(shadowP))

        const progSky = gl.createProgram()
        gl.attachShader(progSky, loadShader(gl, assets['shader_skyVert'], gl.VERTEX_SHADER))
        gl.attachShader(progSky, loadShader(gl, assets['shader_skyFrag'], gl.FRAGMENT_SHADER))
        gl.linkProgram(progSky)
        console.log(gl.getProgramInfoLog(progSky))

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)

        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertex), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'pos'))
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'uv'))
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'normal'))
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'tangent'))
        gl.enableVertexAttribArray(gl.getAttribLocation(prog, 'bitangent'))
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'pos'), 3, gl.FLOAT, false, 14 * 4, 0)
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'uv'), 2, gl.FLOAT, false, 14 * 4, 3 * 4)
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'normal'), 3, gl.FLOAT, false, 14 * 4, 5 * 4)
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'tangent'), 3, gl.FLOAT, false, 14 * 4, 8 * 4)
        gl.vertexAttribPointer(gl.getAttribLocation(prog, 'bitangent'), 3, gl.FLOAT, false, 14 * 4, 11 * 4)

        const eidx = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eidx)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(findex), gl.STATIC_DRAW)

        gl.bindVertexArray(null)

        const skyvao = gl.createVertexArray()
        gl.bindVertexArray(skyvao)

        const skyVertexs = [
            -1., -1., -0.5,
            -1., 1., -0.5,
            1., 1., -0.5,
            1., -1., -0.5
        ]

        const skyvbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, skyvbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyVertexs), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(gl.getAttribLocation(progSky, 'pos'))
        gl.vertexAttribPointer(gl.getAttribLocation(progSky, 'pos'), 3, gl.FLOAT, false, 4 * 3, 0)

        gl.bindVertexArray(null)

        const albedo = gl.createTexture()
        loadTexture(albedo, assets['texture_tank'], gl)

        const ao = gl.createTexture()
        loadTexture(ao, assets['texture_tankAO'], gl)

        const asm = gl.createTexture()
        loadTexture(asm, assets['texture_tankASM'], gl)

        const bump = gl.createTexture()
        loadTexture(bump, assets['texture_normal'], gl)

        const emission = gl.createTexture()
        loadTexture(emission, assets['texture_black'], gl)

        const sky = gl.createTexture()
        loadCubeMap(sky, [
            assets['texture_skyb0'],
            assets['texture_skyb1'],
            assets['texture_skyb2'],
            assets['texture_skyb3'],
            assets['texture_skyb4'],
            assets['texture_skyb5']
        ], gl)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        const shadowBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBuffer)
        const shadowTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, shadowTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowSize, shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTex, 0)
        const shadowRBuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, shadowRBuffer)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, shadowSize, shadowSize)
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, shadowRBuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        displayFuncs.push((delta: number) => {
            let perspective = glm.perspective(glm.radians(65), canvas.width / canvas.height, 0.01, 1000)
            gl.viewport(0, 0, canvas.width, canvas.height)

            gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

            let viewMatrix = gameWorld.getCameraMatrix()

            let light = assets['config_render']
            let sunDir = glm.vec3(light['sunDir'][0], light['sunDir'][1], light['sunDir'][2])
            sunDir = viewMatrix['*'](glm.vec4(glm.normalize(sunDir), 0.))

            gl.useProgram(progSky)

            gl.bindVertexArray(skyvao)

            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'inPerspective'), false, glm.inverse(perspective).array)
            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'perspective'), false, perspective.array)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky)
            gl.uniform1i(gl.getUniformLocation(progSky, 'skyMap'), 2)
            gl.uniform1f(gl.getUniformLocation(progSky, 'time'), gameTime)
            gl.uniformMatrix4fv(gl.getUniformLocation(progSky, 'viewMatrix'), false, viewMatrix.array)
            gl.uniform3f(gl.getUniformLocation(progSky, 'sunDir'), sunDir.x, sunDir.y, sunDir.z)
            gl.uniform3f(gl.getUniformLocation(progSky, 'sunCol'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2])
            gl.uniform3f(gl.getUniformLocation(progSky, 'envCol'), light['envColor'][0], light['envColor'][1], light['envColor'][2])
            gl.uniform1f(gl.getUniformLocation(progSky, 'sunForce'), light['sunForce'])
            gl.uniform1f(gl.getUniformLocation(progSky, 'envForce'), light['envForce'])

            gl.disable(gl.CULL_FACE)
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)

            gl.clear(gl.DEPTH_BUFFER_BIT)

            t += 0.

            let rotate = glm.mat4(
                Math.cos(t), 0., Math.sin(t), 0.,
                0., 1., 0., 0.,
                -Math.sin(t), 0., Math.cos(t), 0.,
                0., 0., 0., 1.
            )['*'](glm.mat4(
                1., 0., 0., 0.,
                0., Math.cos(t / 4.), -Math.sin(t / 4.), 0.,
                0., Math.sin(t / 4.), Math.cos(t / 4.), 0.,
                0., 0., 0., 1.
            ))

            let shadowMatrix = gameWorld.getShadowMatrix(
                glm.vec3(light['sunDir'][0], light['sunDir'][1], light['sunDir'][2]), 30., 30., shadowSize, shadowSize, 120., 60.
            )

            renderShadow(gl, shadowP, light, vao, findex, delta, rotate, shadowMatrix, shadowBuffer, asm)
            gl.viewport(0, 0, canvas.width, canvas.height)

            gl.useProgram(prog)

            gl.bindVertexArray(vao)

            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspective'), false, perspective.array)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, albedo)
            gl.uniform1i(gl.getUniformLocation(prog, 'albedo'), 0)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, ao)
            gl.uniform1i(gl.getUniformLocation(prog, 'tao'), 1)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, asm)
            gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 2)
            gl.activeTexture(gl.TEXTURE3)
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky)
            gl.uniform1i(gl.getUniformLocation(prog, 'skyMap'), 3)
            gl.activeTexture(gl.TEXTURE4)
            gl.bindTexture(gl.TEXTURE_2D, bump)
            gl.uniform1i(gl.getUniformLocation(prog, 'normalMap'), 4)
            gl.activeTexture(gl.TEXTURE5)
            gl.bindTexture(gl.TEXTURE_2D, shadowTex)
            gl.uniform1i(gl.getUniformLocation(prog, 'shadowMap'), 5)
            gl.activeTexture(gl.TEXTURE6)
            gl.bindTexture(gl.TEXTURE_2D, emission)
            gl.uniform1i(gl.getUniformLocation(prog, 'emission'), 6)

            gl.uniform1f(gl.getUniformLocation(prog, 'time'), gameTime)

            // --- light data ---

            gl.uniform3f(gl.getUniformLocation(prog, 'sunDir'), sunDir.x, sunDir.y, sunDir.z)
            gl.uniform3f(gl.getUniformLocation(prog, 'sunColor'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2])
            gl.uniform3f(gl.getUniformLocation(prog, 'envColor'), light['envColor'][0], light['envColor'][1], light['envColor'][2])
            gl.uniform1f(gl.getUniformLocation(prog, 'envForce'), light['envForce'])
            gl.uniform1f(gl.getUniformLocation(prog, 'sunForce'), light['sunForce'])
            gl.clearColor(light['envColor'][0] * light['envForce'], light['envColor'][1] * light['envForce'], light['envColor'][2] * light['envForce'], 1.)
            // ------------------

            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'rotate'), false, rotate.array)
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'inRotate'), false, glm.inverse(rotate).array)
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'viewMatrix'), false, viewMatrix.array)
            gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspectiveShadow'), false, shadowMatrix.array)
            gl.uniform1f(gl.getUniformLocation(prog, 'noiseSize'), 2048)
            gl.uniform1f(gl.getUniformLocation(prog, 'noiseForce'), 0.15)
            gl.uniform3fv(gl.getUniformLocation(prog, 'light'), gameWorld.getArrayOfLight())
            gl.uniform3fv(gl.getUniformLocation(prog, 'lightRGB'), gameWorld.getColorArrayOfLight())

            gl.enable(gl.CULL_FACE)

            gl.drawElements(gl.TRIANGLE_FAN, findex.length, gl.UNSIGNED_INT, 0)

            gameWorld.renderObjects(gl, delta, sky, gameTime, light, viewMatrix, perspective, null, 
                false, shadowMatrix, shadowTex)

            gl.bindVertexArray(null)

            gl.flush()
        })
    }

    export function startGame() {
        gameWorld.prepareObjexts(gameGL, commonProgram)
        let lastTime = 0
        let update = (time: number) => {
            gameTime = time
            for (let i = 0; i < displayFuncs.length; i++) {
                displayFuncs[i]((time - lastTime) / 1000)
                lastTime = time
            }
            window.requestAnimationFrame(update)
        }
        window.requestAnimationFrame(update)
    }
}