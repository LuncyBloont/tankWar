"use strict";
exports.__esModule = true;
var http_1 = require("http");
var fs_1 = require("fs");
var requestFilter_1 = require("./server/requestFilter");
var gameStatus_1 = require("./server/gameStatus");
var server = (0, http_1.createServer)(function (req, res) {
    var imageType = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'icon'];
    var audioType = ['mp3', 'wav'];
    var xType = ['map'];
    var xTypeRel = ['map'];
    var midPos = req.url.indexOf('?');
    if (midPos < 0)
        midPos = req.url.length;
    var path = req.url.substring(1, midPos);
    var params = req.url.substring(midPos, req.url.length);
    var ftype = 'html';
    if (req.method == 'POST') {
        req.on('data', function (data) {
            res.end(gameStatus_1.gameNetwork.gotMsg(data));
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
    }
    else {
        if (path.length == 0) {
            path = 'index.html';
        }
        else {
            ftype = path.substring(path.lastIndexOf('.') + 1, path.length);
        }
        // console.log(`Request to ${path} (type: ${ftype}) with params [${params}]`)
        if (imageType.indexOf(ftype) >= 0) {
            (0, fs_1.readFile)(path, null, function (err, data) {
                if (err) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 No such file: ' + path);
                }
                else {
                    res.statusCode = 200;
                    res.end(data);
                }
            });
        }
        else if (audioType.indexOf(ftype) >= 0) {
            (0, fs_1.readFile)(path, null, function (err, data) {
                if (err) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 No such file: ' + path);
                }
                else {
                    res.statusCode = 200;
                    res.end(data);
                }
            });
        }
        else if (xType.indexOf(ftype) >= 0) {
            var relPath_1 = path.substring(0, path.lastIndexOf('.')) + '.' + xTypeRel[xType.indexOf(ftype)];
            console.log(relPath_1);
            (0, fs_1.readFile)(relPath_1, null, function (err, data) {
                if (err) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 No such xfile' + relPath_1 + ' (' + path + ')');
                }
                else {
                    res.statusCode = 200;
                    res.end((0, requestFilter_1.xFile)(data, ftype));
                }
            });
        }
        else {
            (0, fs_1.readFile)(path, 'utf-8', function (err, data) {
                if (err) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('404 No such file: ' + path);
                }
                else {
                    var content = (0, requestFilter_1.requestFile)(data, ftype);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', content.type);
                    res.end(content.data);
                }
            });
        }
    }
});
gameStatus_1.gameNetwork.run();
server.listen(3000, '0.0.0.0', function () {
    console.log("Server running at http://127.0.0.1:3000");
});
