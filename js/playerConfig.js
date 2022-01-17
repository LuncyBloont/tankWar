var player;
(function (player) {
    player.playerID = '';
    function setPlayerID(name) {
        player.playerID = name + '>>$<<' + new Date().getTime().toString(16);
    }
    player.setPlayerID = setPlayerID;
    function getIDByUI(callback) {
        var ui = document.createElement('div');
        ui.className = 'centerTips ui';
        ui.style.background = '#ACB1AF';
        ui.innerHTML = '输入你的昵称：';
        var input = document.createElement('input');
        ui.appendChild(input);
        var submit = document.createElement('button');
        submit.innerHTML = '确认';
        ui.appendChild(submit);
        submit.addEventListener('click', function (ev) {
            var s = input.value;
            var name = '没有名字的人';
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
