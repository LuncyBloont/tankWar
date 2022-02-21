/// <reference path="./gameLogic.ts" />
var player;
(function (player) {
    player.playerID = '';
    function setPlayerID(name) {
        player.playerID = name + '>>$<<' + localTime().toString(16);
    }
    player.setPlayerID = setPlayerID;
    player.version = 'error';
    player.messageList = [];
    function getIDByUI(callback) {
        var ui = document.createElement('div');
        ui.className = 'centerTips ui';
        ui.style.background = '#ACB1AF';
        ui.innerHTML = '输入你的昵称（仅限字母和数字）：<br />';
        var input = document.createElement('input');
        ui.appendChild(input);
        var submit = document.createElement('button');
        submit.innerHTML = '确认';
        ui.appendChild(submit);
        submit.addEventListener('click', function (ev) {
            var s = input.value;
            var name = 'unknown' + Math.floor(Math.random() * 100000.);
            for (var i = 0; i < s.length; i++) {
                if (s.charAt(i) != ' ') {
                    name = s;
                    break;
                }
            }
            setPlayerID(name);
            callback();
            ui.remove();
        });
        document.body.appendChild(ui);
    }
    player.getIDByUI = getIDByUI;
})(player || (player = {}));
