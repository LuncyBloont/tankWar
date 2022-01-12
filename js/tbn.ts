/// <reference path="./glm-js.min.d.ts" />


function calTB(v: any, v1: any, v2: any, uv: any, uv1: any, uv2: any): Array<number> {
    let e1 = v1['-'](v)
    let e2 = v2['-'](v)
    let d1 = uv1['-'](uv)
    let d2 = uv2['-'](uv)
    /*
    e1 = T * d1.x + B * d1.y
    e2 = T * d2.x + B * d2.y

    e1 * d2.y = T * d1.x * d2.y + B * d1.y * d2.y
    e2 * d1.y = T * d1.y * d2.x + B * d1.y * d2.y
    e1 * d2.y - e2 * d1.y = T * d1.x * d2.y - T * d1.y * d2.x = T * (d1.x * d2.y - d1.y * d2.x)
    T = (e1 * d2.y - e2 * d1.y) / (d1.x * d2.y - d1.y * d2.x)
    
    e1 * d2.x = T * d1.x * d2.x + B * d1.y * d2.x
    e2 * d1.x = T * d2.x * d1.x + B * d2.y * d1.x
    e1 * d2.x - e2 * d1.x = B * d1.y * d2.x - B * d2.y * d1.x = B * (d1.y * d2.x - d2.y * d1.x)
    B = (e1 * d2.x - e2 * d1.x) / (d1.y * d2.x - d2.y * d1.x)
    */
    let t = glm.normalize((e1['*'](d2.y)['-'](e2['*'](d1.y)))['/'](d1.x * d2.y - d1.y * d2.x))
    let b = glm.normalize((e1['*'](d2.x)['-'](e2['*'](d1.x)))['/'](d1.y * d2.x - d2.y * d1.x))
    return [t.x, t.y, t.z, b.x, b.y, b.z]
}

function genTBN(model: any) {
    let nvs = []
    let fs = model.face
    let vs = model.vertex
    for (let i = 0; i < fs.length; i++) {
        for (let j = 0; j < fs[i].length; j++) {
            let v = fs[i][j] * 8
            let v1: any, v2: any
            if (j == 0) {
                v1 = fs[i][fs[i].length - 1] * 8
                v2 = fs[i][j + 1] * 8
            } else if (j == fs[i].length - 1) {
                v1 = fs[i][j - 1] * 8
                v2 = fs[i][0] * 8
            } else {
                v1 = fs[i][j - 1] * 8
                v2 = fs[i][j + 1] * 8
            }
            for (let k = 0; k < 8; k++) {
                nvs.push(vs[v + k])
            }

            let tb = calTB(
                glm.vec3(vs[v], vs[v + 1], vs[v + 2]),
                glm.vec3(vs[v1], vs[v1 + 1], vs[v1 + 2]),
                glm.vec3(vs[v2], vs[v2 + 1], vs[v2 + 2]),
                glm.vec2(vs[v + 3], vs[v + 4]),
                glm.vec2(vs[v1 + 3], vs[v1 + 4]),
                glm.vec2(vs[v2 + 3], vs[v2 + 4]),
            )

            for (let k = 0; k < tb.length; k++) {
                nvs.push(tb[k])
            }
        }
    }

    model.vertex = nvs
}