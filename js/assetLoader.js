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
            document.write('Game assets list config request error. <a href="127.0.0.1:3000/index.html">RETRY</a>');
        }
    });
    request.open('GET', './config/assets.json');
    request.send(null);
}
function waitAssetLoadDone(func) {
    var wait = setInterval(function () {
        console.log('loading');
        ialert('Loading...' + Math.round(assetsNow / assetsTask * 100) + '%');
        if (assetsNow == assetsTask) {
            func();
            clearInterval(wait);
        }
    }, 500);
}
function loadOne(index, nameList) {
    if (index >= nameList.length) {
        console.log('All assets got!');
        return;
    }
    var root = nameList[index].substring(0, nameList[index].indexOf('_'));
    var i = nameList[index];
    if (root == 'texture') {
        var img_1 = new Image();
        img_1.addEventListener('load', function (ev) {
            assets[i] = img_1;
            assetsNow += 1;
            console.log(assetTabel[i] + ' GOT!');
            loadOne(index + 1, nameList);
        });
        img_1.addEventListener('error', function (ev) {
            document.write('Web multimedia assets request error. <a href="127.0.0.1:3000/index.html">RETRY</a>');
        });
        img_1.src = assetTabel[i];
    }
    if (root == 'audio') {
        var adu_1 = new Audio();
        adu_1.addEventListener('loadeddata', function (ev) {
            assets[i] = adu_1;
            assetsNow += 1;
            console.log(assetTabel[i] + ' GOT!');
            loadOne(index + 1, nameList);
        });
        adu_1.addEventListener('error', function (ev) {
            document.write('Game multimedia assets request error. <a href="127.0.0.1:3000/index.html">RETRY</a>');
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
                loadOne(index + 1, nameList);
            }
            else {
                document.write('failed to reqest config assets. <a href="127.0.0.1:3000/index.html">RETRY</a>');
            }
        });
        confRequire_1.open('GET', assetTabel[i]);
        confRequire_1.send(null);
    }
    if (root == 'text' || root == 'shader' || root == 'model') {
        var request_1 = new XMLHttpRequest();
        request_1.addEventListener('load', function (ev) {
            if (request_1.status == 200) {
                assets[i] = request_1.response;
                assetsNow += 1;
                console.log(assetTabel[i] + ' GOT!');
                loadOne(index + 1, nameList);
            }
            else {
                document.write('Game assets request error <a href="127.0.0.1:3000/index.html">RETRY</a>');
            }
        });
        request_1.open('GET', assetTabel[i]);
        request_1.send(null);
    }
    if (root == 'map') {
        var request_2 = new XMLHttpRequest();
        request_2.responseType = 'arraybuffer';
        request_2.addEventListener('load', function (ev) {
            if (request_2.status == 200) {
                assets[i] = new Uint8Array(request_2.response);
                var arr = assets[i];
                console.log(arr);
                assetsNow += 1;
                console.log(assetTabel[i] + ' GOT!');
                loadOne(index + 1, nameList);
            }
            else {
                document.write('Game assets request error <a href="127.0.0.1:3000/index.html">RETRY</a>');
            }
        });
        request_2.open('GET', assetTabel[i]);
        request_2.send(null);
    }
}
function initAssets() {
    assetsNow = 0;
    assetsTask = 0;
    var nameList = [];
    for (var i in assetTabel) {
        assetsTask += 1;
        nameList.push(i);
    }
    loadOne(0, nameList);
}
function cLoadAsset(onload) {
    readAssetsTable(onload);
}
