"use strict";
exports.__esModule = true;
exports.requestFile = exports.xFile = void 0;
function xFile(data, type) {
    if (type == 'map') {
        return data;
    }
}
exports.xFile = xFile;
function requestFile(data, type) {
    var textType = '';
    switch (type) {
        case 'html':
            textType = 'text/html';
            break;
        case 'js':
            textType = 'text/javascript';
            break;
        case 'css':
            textType = 'text/css';
            break;
        case 'json':
            textType = 'text/json';
            break;
        default:
            textType = 'text/plain';
            data = customFormat(data, type);
    }
    return { type: textType, data: data };
}
exports.requestFile = requestFile;
function customFormat(data, type) {
    switch (type) {
        case 'obj':
            return loadObj2JSON(data);
        default:
            return data;
    }
}
function loadObj2JSON(data) {
    var lines = data.split('\n');
    var json = ['{'];
    var vs = [];
    var ts = [];
    var ns = [];
    var vinfo = [];
    var fs = [];
    for (var l in lines) {
        var tokens = lines[l].split(' ');
        if (lines[l][0] == 'v') {
            if (lines[l][1] == 't') {
                ts.push("".concat(parseFloat(tokens[1]), ",").concat(parseFloat(tokens[2])));
            }
            else if (lines[l][1] == 'n') {
                ns.push("".concat(parseFloat(tokens[1]), ",").concat(parseFloat(tokens[2]), ",").concat(parseFloat(tokens[3])));
            }
            else {
                vs.push("".concat(parseFloat(tokens[1]), ",").concat(parseFloat(tokens[2]), ",").concat(parseFloat(tokens[3])));
            }
        }
        else if (lines[l][0] == 'f') {
            fs.push('');
            for (var fi = 1; fi < tokens.length; fi++) {
                var id_uv_normal = tokens[fi].split('/');
                var id = parseInt(id_uv_normal[0]) - 1;
                var uv = parseInt(id_uv_normal[1]) - 1;
                var normal = parseInt(id_uv_normal[2]) - 1;
                var fvid = vinfo.length;
                vinfo.push(vs[id] + ',' + ts[uv] + ',' + ns[normal]);
                if (fs[fs.length - 1].length > 0)
                    fs[fs.length - 1] += ',';
                fs[fs.length - 1] += fvid;
            }
        }
    }
    json.push('"vertex":[');
    for (var i = 0; i < vinfo.length; i++) {
        var onev = '';
        if (i != 0)
            onev = ',';
        json.push(onev + vinfo[i]);
    }
    json.push('],');
    json.push('"face":[');
    for (var i = 0; i < fs.length; i++) {
        var onef = '';
        if (i != 0)
            onef = ',';
        json.push(onef + '[' + fs[i] + ']');
    }
    json.push(']');
    json.push('}');
    return json.join('');
}
