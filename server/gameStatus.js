"use strict";
exports.__esModule = true;
exports.gameNetwork = void 0;
var gameNetwork;
(function (gameNetwork) {
    var lifeTime = 5;
    var statusList = {};
    var lifeList = {};
    var timeList = {};
    function run() {
        setInterval(function () {
            for (var i in lifeList) {
                lifeList[i] -= 1;
                if (lifeList[i] <= 0) {
                    console.log("A old status removed. (".concat(i, ")"));
                    delete lifeList[i];
                    delete statusList[i];
                    delete timeList[i];
                }
            }
        }, 1000);
    }
    gameNetwork.run = run;
    function gotMsg(data) {
        var nsts;
        try {
            nsts = JSON.parse(data.toString());
            var respList = [];
            if (!statusList[nsts.owner]) {
                console.log("New status added. (".concat(nsts.owner, ")"));
            }
            else {
                if (nsts.time < timeList[nsts.owner]) {
                    console.log("    A old bag come. (".concat(nsts.owner, ")"));
                    return 'timeout';
                }
            }
            if (nsts.owner && nsts.body) {
                lifeList[nsts.owner] = lifeTime;
                statusList[nsts.owner] = nsts.body;
                timeList[nsts.owner] = nsts.time;
            }
            for (var i in statusList) {
                if (i != nsts.owner) {
                    respList.push(statusList[i]);
                }
            }
            var responseBag = {
                'time': nsts.time,
                'serverTime': Date.now(),
                'list': respList
            };
            return JSON.stringify(responseBag);
        }
        catch (err) {
            return 'timeout';
        }
    }
    gameNetwork.gotMsg = gotMsg;
})(gameNetwork = exports.gameNetwork || (exports.gameNetwork = {}));
