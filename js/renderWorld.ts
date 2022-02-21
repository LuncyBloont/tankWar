/// <reference path="./glm-js.min.d.ts" />
/// <reference path="./assetLoader.ts" />
/// <reference path="./tbn.ts" />

class GameObject {
    active: boolean = true
    show: boolean = true
    name: string = 'default'
    position: any = glm.vec3(0., 0., 0.)
    rotation: any = glm.vec3(0., 0., 0.)
    scale: any = glm.vec3(1., 1., 1.)
    model: string = 'model_docter'
    texture: string = 'texture_kiki'
    textureASM: string = 'texture_kikiASM'
    textureAS: string = 'texture_kikiAS'
    textureNormals: string = 'texture_kikiNormals'
    textureEmission: string = 'texture_black'
    emission: number = 1
    alpha: number = 1
    texColor: any = glm.vec3(1, 1, 1)
    shaderProgram: WebGLProgram = null
    shadow: boolean = true
    noiseSize: number = 1024
    noiseForce: number = 0
    backenPointLight: Array<boolean> = [false, false, false, false, false, false, false, false]
    perFrame: (self: any, gl: WebGL2RenderingContext, delta: number, sahdow: boolean) => void =
        function (self: GameObject, gl: WebGL2RenderingContext, delta: number, shadow: boolean) { }
    perLogic: (self: any, delta: number) => void =
        function (self: GameObject, delta: number) {
            self.rotation.y += delta * 0.0008
        }
    preGame: (self: any, gl: WebGL2RenderingContext) => void =
        function (self: GameObject, gl: WebGL2RenderingContext) { }

    vao: WebGLVertexArrayObject
    idOfTexture: WebGLTexture
    idOfASTexture: WebGLTexture
    idOfASMTexture: WebGLTexture
    idOfNormalsMap: WebGLTexture
    idOfEmissionTexture: WebGLTexture
    findex: Array<number>
}

class Light {
    position: any = glm.vec3(0, 0, 0)
    rgb: any = glm.vec3(0, 0, 0)
    power: number = 0
}

class Heap<T> {
    array: Array<T> = []
    size: number = 0
    max: T
    compare: (a: T, b: T) => boolean
    getLeft(ix: number): number {
        let c = ix * 2
        return c < this.array.length ? c : -1
    }

    getRight(ix: number): number {
        let c = ix * 2 + 1
        return c < this.array.length ? c : -1
    }

    getPre(ix: number): number {
        let c = Math.floor(ix / 2)
        return c
    }

    constructor(count: number, compare: (a: T, b: T) => boolean, max: T) {
        this.array = new Array<T>(count + 1)
        this.max = max
        for (let i = 0; i < count + 1; i++) {
            this.array[i] = max
        }
        this.compare = compare
    }

    clean() {
        for (let i = 0; i < this.array.length; i++) {
            this.array[i] = this.max
        }
    }

    docom(a: T, b: T) {
        if (a == this.max) return false
        if (b == this.max) return true
        if (this.compare(a, b)) return true
        else return false
    }

    insert(a: T): boolean {
        if (this.size + 1 < this.array.length) {
            let ix = this.size + 1
            this.size += 1
            this.array[ix] = a
            while (true) {
                if (ix <= 1) return true
                let p = this.getPre(ix)
                if (this.docom(this.array[ix], this.array[p])) {
                    let ex = this.array[ix]
                    this.array[ix] = this.array[p]
                    this.array[p] = ex
                    ix = p
                } else {
                    return true
                }
            }
        }
        return false
    }

    delete(): T {
        if (this.size > 0) {
            this.size -= 1
            let ix = 1
            let res = this.array[1]
            this.array[1] = this.max
            while (true) {
                let l = this.getLeft(ix)
                let r = this.getRight(ix)
                let up = ix
                if (l < this.array.length && this.docom(this.array[l], this.array[up])) {
                    up = l
                }
                if (r < this.array.length && this.docom(this.array[r], this.array[up])) {
                    up = r
                }

                if (up == ix) {
                    return res
                }

                let ex = this.array[ix]
                this.array[ix] = this.array[up]
                this.array[up] = ex
                ix = up
            }
        }
        return this.max
    }

    top(): T {
        return this.array[1]
    }
}

namespace gameWorld {
    export const camera = {
        position: glm.vec3(0., 15., 5.),
        front: glm.vec3(0., 0., -1.),
        right: glm.vec3(1., 0., 0.),
        up: glm.vec3(0., 1., 0.),
        readOnlyRotation: glm.vec3(0, 0, 0),
        fov: 65.
    }

    export const objects: Array<GameObject> = []

    const lights: Array<Light> = [
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light(),
        new Light(), new Light(), new Light(), new Light()
    ]

    const lightMark: Array<boolean> = [
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, false
    ]

    const lightHost: Array<GameObject> = [
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null
    ]

    const lightCount = 32

    export function setLight(l: Light, index: number) {
        if (index >= 0 && index < lightCount) {
            lights[index] = l
        }
    }

    export function getLight(index: number) {
        if (index >= 0 && index < lightCount) {
            return lights[index]
        }
    }

    export function getLightHost(index: number) {
        return lightHost[index]
    }

    export function newLight(host: GameObject): number {
        for (let i = 0; i < lightMark.length; i++) {
            if (!lightMark[i]) {
                lightMark[i] = true
                lightHost[i] = host
                return i
            }
        }

        for (let i = 0; i < lightMark.length; i++) {
            if (lights[i].power <= 0 || lights[i].rgb.x <= 0 || lights[i].rgb.y <= 0 || lights[i].rgb.z <= 0) {
                lightHost[i] = host
                lightMark[i] = true
                return i
            }
        }

        let min = 0
        let minP = 1e9
        for (let i = 0; i < lightMark.length; i++) {
            if (lights[i].power <= minP) {
                minP = lights[i].power
                min = i
            }
        }
        lightHost[min] = host
        lightMark[min] = true
        return min
    }

    export function deleteLight(index: number): number {
        if (index < 0 || index >= lightCount) {
            return -1
        }
        if (lightMark[index]) {
            lightMark[index] = false
            return index
        } else {
            return -1
        }
    }

    let lightHeap = new Heap<Light>(64,
        (a: Light, b: Light) => {
            return a.power > b.power
        }, null)

    export function sortLight() {
        lightHeap.clean()
        for (let i = 0; i < lightCount; i++) {
            lightHeap.insert(lights[i])
        }
    }

    export function getArrayOfLight(): Array<Float32Array> {
        let arr = []
        let arr2 = []
        for (let i = 0; i < lightCount; i++) {
            let l = lightHeap.delete()
            arr.push(l.position.x)
            arr.push(l.position.y)
            arr.push(l.position.z)
            arr2.push(l.rgb.x * l.power)
            arr2.push(l.rgb.y * l.power)
            arr2.push(l.rgb.z * l.power)
        }
        return [new Float32Array(arr), new Float32Array(arr2)]
    }

    function fixCamera() {
        camera.front = glm.normalize(camera.front)
        camera.right = glm.normalize(glm.cross(camera.front, glm.vec3(0., 1., 0.)))
        camera.up = glm.cross(camera.right, camera.front)
        let rinxz = glm.vec2(-camera.front.z, -camera.front.x)
        camera.readOnlyRotation = glm.vec3(Math.atan2(camera.front.y, glm.length(rinxz)), Math.atan2(rinxz.y, rinxz.x), 0)
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
        let m = glm.mat4(
            1 / lwidth / 2., 0., 0., 0.,
            0., 1 / lheight / 2., 0., 0.,
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
        return m
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
        for (let i in objects) {
            const gobj = objects[i]
            perpareOne(gl, program, gobj)
        }
    }

    export function rotateVec3(vec: any, rot: any) {
        let nv = glm.vec4(vec, 0)

        let res = rotateMat(rot)['*'](nv)

        return glm.vec3(res.x, res.y, res.z)
    }

    export function rotateMat(rot: any) {
        let cosx = Math.cos(rot.x), sinx = Math.sin(rot.x)
        let cosy = Math.cos(rot.y), siny = Math.sin(rot.y)
        let cosz = Math.cos(rot.z), sinz = Math.sin(rot.z)

        let r = glm.mat4(
            cosy, 0., -siny, 0.,
            0., 1., 0., 0.,
            siny, 0., cosy, 0.,
            0., 0., 0., 1.
        )['*'](glm.mat4(
            1., 0., 0., 0.,
            0., cosx, sinx, 0.,
            0., -sinx, cosx, 0.,
            0., 0., 0., 1.
        ))['*'](glm.mat4(
            cosz, sinz, 0., 0.,
            -sinz, cosz, 0., 0.,
            0., 0., 1., 0.,
            0., 0., 0., 1.
        ))
        return r
    }

    export function renderObjects(gl: WebGL2RenderingContext, delta: number, sky: WebGLTexture,
        time: number, light: any, viewMat: any, perspective: any, program: WebGLProgram, shadow: boolean,
        shadowMat: any, shadowMap: WebGLTexture) {
        let lightList: Array<Float32Array>
        if (!shadow) {
            sortLight()
            lightList = getArrayOfLight()
        }
        for (let i in objects) {
            let gobj = objects[i]
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
                gl.uniform1f(gl.getUniformLocation(prog, 'noiseSize'), gobj.noiseSize)
                gl.uniform1f(gl.getUniformLocation(prog, 'noiseForce'), gobj.noiseForce)
                gl.uniform1f(gl.getUniformLocation(prog, 'sunForce'), light['sunForce'])
                gl.uniform1f(gl.getUniformLocation(prog, 'envForce'), light['envForce'])
                gl.uniform3f(gl.getUniformLocation(prog, 'sunColor'), light['sunColor'][0], light['sunColor'][1], light['sunColor'][2])
                gl.uniform3f(gl.getUniformLocation(prog, 'envColor'), light['envColor'][0], light['envColor'][1], light['envColor'][2])
                gl.uniform3fv(gl.getUniformLocation(prog, 'light'), lightList[0])
                gl.uniform3fv(gl.getUniformLocation(prog, 'lightRGB'), lightList[1])

                gl.uniform1f(gl.getUniformLocation(prog, 'emissionForce'), gobj.emission)
                gl.uniform1f(gl.getUniformLocation(prog, 'alpha'), gobj.alpha)
                gl.uniform3f(gl.getUniformLocation(prog, 'mainColor'), gobj.texColor.x, gobj.texColor.y, gobj.texColor.z)
            } else {
                gl.uniform1f(gl.getUniformLocation(prog, 'time'), time)
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, gobj.idOfASMTexture)
                gl.uniform1f(gl.getUniformLocation(prog, 'alpha'), gobj.alpha)
                gl.uniform1i(gl.getUniformLocation(prog, 'tasm'), 0)
            }

            let trans = glm.mat4(
                1., 0., 0., 0.,
                0., 1., 0., 0.,
                0., 0., 1., 0.,
                gobj.position.x, gobj.position.y, gobj.position.z, 1.
            )['*'](rotateMat(gobj.rotation))['*'](glm.mat4(
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
            if (gl.getUniformLocation(prog, 'inRotate') != -1) {
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
        for (let i in objects) {
            let gobj = objects[i]
            if (!gobj.active) continue
            gobj.perLogic(gobj, delta)
        }
    }
}


