/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
/// <reference path="./tbn.ts" />

class GameObject {
    active: boolean = true
    show: boolean = true
    name: string = 'default'
    position: any = glm.vec3(1., 2., 0.)
    rotation: any = glm.vec3(0., 0., 0.)
    scale: any = glm.vec3(1., 1., 1.)
    model: string = 'model_docter'
    texture: string = 'texture_kiki'
    textureASM: string = 'texture_kikiASM'
    textureAS: string = 'texture_kikiAS'
    textureNormals: string = 'texture_kikiNormals'
    textureEmission: string = 'texture_black'
    shaderProgram: WebGLProgram = null
    shadow: boolean = true
    perFrame: Function = function (self: GameObject, gl: WebGL2RenderingContext, delta: number, shadow: boolean) { }
    perLogic: Function = function (self: GameObject, delta: number) {
        self.rotation.y += delta * 0.008
    }
    preGame: Function = function (self: GameObject, gl: WebGL2RenderingContext) { }

    vao: WebGLVertexArrayObject
    idOfTexture: WebGLTexture
    idOfASTexture: WebGLTexture
    idOfASMTexture: WebGLTexture
    idOfNormalsMap: WebGLTexture
    idOfEmissionTexture: WebGLTexture
    findex: Array<number>
}

namespace gameWorld {
    export const camera = {
        position: glm.vec3(0., 0., 5.),
        front: glm.vec3(0., 0., -1.),
        right: glm.vec3(1., 0., 0.),
        up: glm.vec3(0., 1., 0.),
        fov: 65.
    }
    export const Objects: Array<GameObject> = []

    function fixCamera() {
        camera.front = glm.normalize(camera.front)
        camera.right = glm.normalize(glm.cross(camera.front, glm.vec3(0., 1., 0.)))
        camera.up = glm.cross(camera.right, camera.front)
    }

    /**
     * Make the camera look at 'end' from 'start' in world space
     * @param start glm.vec3
     * @param end glm.vec3
     */
    export function lookAt(start: any, end: any) {
        camera.position = start
        camera.front = end['-'](start)
        fixCamera()
    }

    export function setCameraAndDirection(pos: any, dir: any) {
        camera.position = pos
        camera.front = dir
        fixCamera()
    }

    export function getCameraMatrix() {
        return glm.mat4(
            camera.right.x, camera.up.x, -camera.front.x, 0.,
            camera.right.y, camera.up.y, -camera.front.y, 0.,
            camera.right.z, camera.up.z, -camera.front.z, 0.,
            0., 0., 0., 1.
        )['*'](glm.mat4(
            1., 0., 0., 0.,
            0., 1., 0., 0.,
            0., 0., 1., 0.,
            -camera.position.x, -camera.position.y, -camera.position.z, 1.
        ))
    }

    export function getShadowMatrix(sunDir: any, lwidth: number, lheight: number,
        twidth: number, theight: number, ldepth: number, offset: number) {
        let front = glm.normalize(sunDir)
        let right = glm.normalize(glm.cross(front, glm.vec3(0., 0., 1.)))
        let up = glm.cross(right, front)
        return glm.mat4(
            twidth / lwidth / 2., 0., 0., 0.,
            0., theight / lheight / 2., 0., 0.,
            0., 0., 1. / ldepth, 0.,
            0., 0., offset / ldepth, 1.
        )['*'](glm.mat4(
            right.x, up.x, front.x, 0.,
            right.y, up.y, front.y, 0.,
            right.z, up.z, front.z, 0.,
            0., 0., 0., 1.
        ))['*'](glm.mat4(
            1., 0., 0., 0.,
            0., 1., 0., 0.,
            0., 0., 1., 0.,
            -camera.position.x, -camera.position.y, -camera.position.z, 1.
        ))
    }

    export function perpareOne(gl: WebGL2RenderingContext, program: WebGLProgram, gobj: GameObject) {
        const model = JSON.parse(assets[gobj.model])
        genTBN(model)
        console.log(`G Object ${gobj.name} use ${gobj.shaderProgram ? 'special' : 'common'} program.`)
        gobj.shaderProgram = gobj.shaderProgram ? gobj.shaderProgram : program
        gobj.vao = gl.createVertexArray()
        gobj.idOfTexture = gl.createTexture()
        gobj.idOfASTexture = gl.createTexture()
        gobj.idOfASMTexture = gl.createTexture()
        gobj.idOfNormalsMap = gl.createTexture()
        gobj.idOfEmissionTexture = gl.createTexture()

        gl.bindVertexArray(gobj.vao)
        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertex), gl.STATIC_DRAW)
        gobj.findex = []
        for (let fi = 0; fi < model.face.length; fi++) {
            for (let vi = 0; vi < model.face[fi].length; vi++) {
                gobj.findex.push(model.face[fi][vi])
            }
            gobj.findex.push(Math.pow(2, 32) - 1)
        }
        gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'pos'))
        gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'pos'), 3, gl.FLOAT, false, 14 * 4, 0)
        if (gl.getAttribLocation(gobj.shaderProgram, 'uv') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'uv'))
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'uv'), 2, gl.FLOAT, false, 14 * 4, 3 * 4)
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'normal') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'normal'))
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'normal'), 3, gl.FLOAT, true, 14 * 4, 5 * 4)
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'tangent') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'tangent'))
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'tangent'), 3, gl.FLOAT, true, 14 * 4, 8 * 4)
        }
        if (gl.getAttribLocation(gobj.shaderProgram, 'bitangent') != -1) {
            gl.enableVertexAttribArray(gl.getAttribLocation(gobj.shaderProgram, 'bitangent'))
            gl.vertexAttribPointer(gl.getAttribLocation(gobj.shaderProgram, 'bitangent'), 3, gl.FLOAT, true, 14 * 4, 11 * 4)
        }

        const ebo = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(gobj.findex), gl.STATIC_DRAW)
        gl.bindVertexArray(null)

        const linkTexture = function (texName: string, id: WebGLTexture) {
            gl.bindTexture(gl.TEXTURE_2D, id)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, assets[texName])
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.generateMipmap(gl.TEXTURE_2D)
        }

        linkTexture(gobj.texture, gobj.idOfTexture)
        linkTexture(gobj.textureAS, gobj.idOfASTexture)
        linkTexture(gobj.textureASM, gobj.idOfASMTexture)
        linkTexture(gobj.textureNormals, gobj.idOfNormalsMap)
        linkTexture(gobj.textureEmission, gobj.idOfEmissionTexture)

        gobj.preGame(gobj, gl)
    }

    export function prepareObjexts(gl: WebGL2RenderingContext, program: WebGLProgram) {
        for (let i in Objects) {
            const gobj = Objects[i]
            perpareOne(gl, program, gobj)
        }
    }

    export function renderObjects(gl: WebGL2RenderingContext, delta: number, sky: WebGLTexture,
        time: number, light: any, viewMat: any, perspective: any, program: WebGLProgram, shadow: boolean,
        shadowMat: any, shadowMap: WebGLTexture) {
        for (let i in Objects) {
            let gobj = Objects[i]
            if (!gobj.active || !gobj.show || (shadow && !gobj.shadow)) continue
            let prog = program ? program : gobj.shaderProgram
            gl.useProgram(prog)
            gl.bindVertexArray(gobj.vao)
            if (!shadow) {
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfTexture)
                gl.uniform1i(gl.getUniformLocation(prog, 'albedo'), 0)
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASTexture)
                gl.uniform1i(gl.getUniformLocation(prog, 'tao'), 1)
                gl.activeTexture(gl.TEXTURE2)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASMTexture)
                gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 2)
                gl.activeTexture(gl.TEXTURE3)
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky)
                gl.uniform1i(gl.getUniformLocation(prog, 'skyMap'), 3)
                gl.activeTexture(gl.TEXTURE4)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfNormalsMap)
                gl.uniform1i(gl.getUniformLocation(prog, 'normalMap'), 4)
                gl.activeTexture(gl.TEXTURE5)
                gl.bindTexture(gl.TEXTURE_2D, shadowMap)
                gl.uniform1i(gl.getUniformLocation(prog, 'shadowMap'), 5)
                gl.activeTexture(gl.TEXTURE6)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfEmissionTexture)
                gl.uniform1i(gl.getUniformLocation(prog, 'emission'), 6)

                gl.uniform1f(gl.getUniformLocation(prog, 'time'), time)
                gl.uniform1f(gl.getUniformLocation(prog, 'sunForce'), light['sunForce'])
                gl.uniform1f(gl.getUniformLocation(prog, 'envForce'), light['envForce'])
                gl.uniform3f(gl.getUniformLocation(prog, 'sunColor'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2])
                gl.uniform3f(gl.getUniformLocation(prog, 'envColor'), light['envColor'][0], light['envColor'][1], light['envColor'][2])
            }

            let cosx = Math.cos(gobj.rotation.x), sinx = Math.sin(gobj.rotation.x)
            let cosy = Math.cos(gobj.rotation.y), siny = Math.sin(gobj.rotation.y)
            let cosz = Math.cos(gobj.rotation.z), sinz = Math.sin(gobj.rotation.z)

            let trans = glm.mat4(
                1., 0., 0., 0.,
                0., 1., 0., 0.,
                0., 0., 1., 0.,
                gobj.position.x, gobj.position.y, gobj.position.z, 1.
            )['*'](glm.mat4(
                cosy, 0., -siny, 0.,
                0., 1., 0., 0.,
                siny, 0., cosy, 0.,
                0., 0., 0., 1.
            ))['*'](glm.mat4(
                1., 0., 0., 0.,
                0., cosx, sinx, 0.,
                0., -sinx, cosx, 0.,
                0., 0., 0., 1.
            ))['*'](glm.mat4(
                cosz, sinz, 0., 0.,
                -sinz, cosz, 0., 0.,
                0., 0., 1., 0.,
                0., 0., 0., 1.
            ))['*'](glm.mat4(
                gobj.scale.x, 0., 0., 0,
                0., gobj.scale.y, 0., 0.,
                0., 0., gobj.scale.z, 0.,
                0., 0., 0., 1.
            ))

            if (perspective && gl.getUniformLocation(prog, 'perspective') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspective'), false, perspective.array)
            }
            if (gl.getUniformLocation(prog, 'rotate') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'rotate'), false, trans.array)
            }
            if (gl.getUniformLocation(prog, 'inRotate') != -1)
            {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'inRotate'), false, glm.inverse(trans).array)
            }
            if (viewMat && gl.getUniformLocation(prog, 'viewMatrix') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'viewMatrix'), false, viewMat.array)
            }
            if (shadowMat && gl.getUniformLocation(prog, 'perspectiveShadow') != -1) {
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'perspectiveShadow'), false, shadowMat.array)
            }

            gobj.perFrame(gobj, gl, delta, shadow)
            gl.drawElements(gl.TRIANGLE_FAN, gobj.findex.length, gl.UNSIGNED_INT, 0)
        }
    }

    export function logicLoop(delta: number) {
        for (let i in Objects) {
            let gobj = Objects[i]
            if (!gobj.active) continue
            gobj.perLogic(gobj, delta)
        }
    }
}


