/// <reference path="./glm-js.min.d.ts" />
function calTB(v, v1, v2, uv, uv1, uv2) {
    var e1 = v1['-'](v);
    var e2 = v2['-'](v);
    var d1 = uv1['-'](uv);
    var d2 = uv2['-'](uv);
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
    var t = glm.normalize((e1['*'](d2.y)['-'](e2['*'](d1.y)))['/'](d1.x * d2.y - d1.y * d2.x));
    var b = glm.normalize((e1['*'](d2.x)['-'](e2['*'](d1.x)))['/'](d1.y * d2.x - d2.y * d1.x));
    return [t.x, t.y, t.z, b.x, b.y, b.z];
}
function genTBN(model) {
    var nvs = [];
    var fs = model.face;
    var vs = model.vertex;
    for (var i = 0; i < fs.length; i++) {
        for (var j = 0; j < fs[i].length; j++) {
            var v = fs[i][j] * 8;
            var v1 = void 0, v2 = void 0;
            if (j == 0) {
                v1 = fs[i][fs[i].length - 1] * 8;
                v2 = fs[i][j + 1] * 8;
            }
            else if (j == fs[i].length - 1) {
                v1 = fs[i][j - 1] * 8;
                v2 = fs[i][0] * 8;
            }
            else {
                v1 = fs[i][j - 1] * 8;
                v2 = fs[i][j + 1] * 8;
            }
            for (var k = 0; k < 8; k++) {
                nvs.push(vs[v + k]);
            }
            var tb = calTB(glm.vec3(vs[v], vs[v + 1], vs[v + 2]), glm.vec3(vs[v1], vs[v1 + 1], vs[v1 + 2]), glm.vec3(vs[v2], vs[v2 + 1], vs[v2 + 2]), glm.vec2(vs[v + 3], vs[v + 4]), glm.vec2(vs[v1 + 3], vs[v1 + 4]), glm.vec2(vs[v2 + 3], vs[v2 + 4]));
            for (var k = 0; k < tb.length; k++) {
                nvs.push(tb[k]);
            }
        }
    }
    model.vertex = nvs;
}
