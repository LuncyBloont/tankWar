"use strict";
exports.__esModule = true;
var http_1 = require("http");
var fs_1 = require("fs");
var requestFilter_1 = require("./server/requestFilter");
var server = (0, http_1.createServer)(function (req, res) {
    var imageType = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];
    var audioType = ['mp3', 'wav'];
    var midPos = req.url.indexOf('?');
    if (midPos < 0)
        midPos = req.url.length;
    var path = req.url.substring(1, midPos);
    var params = req.url.substring(midPos, req.url.length);
    var ftype = 'html';
    if (path.length == 0) {
        path = 'index.html';
    }
    else {
        ftype = path.substring(path.lastIndexOf('.') + 1, path.length);
    }
    console.log("Request to ".concat(path, " (type: ").concat(ftype, ") with params [").concat(params, "]"));
    if (imageType.indexOf(ftype) >= 0) {
        (0, fs_1.readFile)(path, null, function (err, data) {
            if (err) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('404 No such file: ' + path);
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'image/' + ftype);
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
                res.setHeader('Content-Type', 'audio/' + ftype);
                res.end(data);
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
});
server.listen(3000, '0.0.0.0', function () {
    console.log("Server running at http://127.0.0.1:3000");
});
