/// <reference path="./alert.ts" />
var assetTabel = {};
var assets = {};
var assetsNow = 0;
var assetsTask = 0;
function readAssetsTable(onloadfunc) {
    var request = new XMLHttpRequest();
    request.addEventListener('load', function (ev) {
        if (request.status == 200) {
            assetTabel = JSON.parse(request.responseText);
            initAssets();
            waitAssetLoadDone(onloadfunc);
        }
        else {
            document.write('Game assets list config request error.');
        }
    });
    request.open('get', './config/assets.json');
    request.send(null);
}
function waitAssetLoadDone(func) {
    var wait = setInterval(function () {
        console.log('loading');
        ialert('Loading...' + Math.round(assetsNow / assetsTask * 100) + '%');
        if (assetsNow == assetsTask) {
            func();
            clearInterval(wait);
            console.log(assets);
        }
    }, 500);
}
function initAssets() {
    assetsNow = 0;
    assetsTask = 0;
    var _loop_1 = function (i) {
        assetsTask += 1;
        var root = i.substring(0, i.indexOf('_'));
        if (root == 'texture') {
            var img_1 = new Image();
            img_1.addEventListener('load', function (ev) {
                assets[i] = img_1;
                assetsNow += 1;
                console.log(assetTabel[i] + ' GOT!');
            });
            img_1.addEventListener('error', function (ev) {
                console.log('Web multimedia assets request error.');
            });
            img_1.src = assetTabel[i];
        }
        if (root == 'audio') {
            var adu_1 = new Audio();
            adu_1.addEventListener('load', function (ev) {
                assets[i] = adu_1;
                assetsNow += 1;
                console.log(assetTabel[i] + ' GOT!');
            });
            adu_1.addEventListener('error', function (ev) {
                console.log('Game multimedia assets request error.');
            });
            adu_1.src = assetTabel[i];
        }
        if (root == 'config') {
            var confRequire_1 = new XMLHttpRequest();
            confRequire_1.addEventListener('load', function (ev) {
                if (confRequire_1.status == 200) {
                    assets[i] = JSON.parse(confRequire_1.response);
                    assetsNow += 1;
                    console.log(assetTabel[i] + ' GOT!');
                }
                else {
                    console.log('failed to reqest config assets.');
                }
            });
            confRequire_1.open('get', assetTabel[i]);
            confRequire_1.send(null);
        }
        if (root == 'text' || root == 'shader' || root == 'model') {
            var request_1 = new XMLHttpRequest();
            request_1.addEventListener('load', function (ev) {
                if (request_1.status == 200) {
                    assets[i] = request_1.response;
                    assetsNow += 1;
                    console.log(assetTabel[i] + ' GOT!');
                }
                else {
                    console.log('Game assets request error');
                }
            });
            request_1.open('get', assetTabel[i]);
            request_1.send(null);
        }
    };
    for (var i in assetTabel) {
        _loop_1(i);
    }
}
function cLoadAsset(onload) {
    readAssetsTable(onload);
}
