"use strict";
exports.__esModule = true;
exports.gameNetwork = void 0;
var gameNetwork;
(function (gameNetwork) {
    var lifeTime = 5;
    var statusList = {};
    var lifeList = {};
    function run() {
        setInterval(function () {
            for (var i in lifeList) {
                lifeList[i] -= 1;
                if (lifeList[i] <= 0) {
                    delete lifeList[i];
                    delete statusList[i];
                    console.log('A old status removed.');
                }
            }
        }, 1000);
    }
    gameNetwork.run = run;
    function gotMsg(data) {
        var nsts = JSON.parse(data.toString());
        var respList = [];
        if (!statusList[nsts.owner]) {
            console.log('New status added.');
        }
        if (nsts.owner && nsts.body) {
            lifeList[nsts.owner] = lifeTime;
            statusList[nsts.owner] = nsts.body;
        }
        for (var i in statusList) {
            if (i != nsts.owner) {
                respList.push(statusList[i]);
            }
        }
        return JSON.stringify(respList);
    }
    gameNetwork.gotMsg = gotMsg;
})(gameNetwork = exports.gameNetwork || (exports.gameNetwork = {}));
