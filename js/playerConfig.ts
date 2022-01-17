namespace player {
    export let playerID: string = ''
    export function setPlayerID(name: string) {
        playerID = name + '>>$<<' + new Date().getTime().toString(16)
    }

    export function getIDByUI(callback: Function) {
        let ui = document.createElement('div')
        ui.className = 'centerTips ui'
        ui.style.background = '#ACB1AF'
        ui.innerHTML = '输入你的昵称：'
        let input = document.createElement('input')
        ui.appendChild(input)
        let submit = document.createElement('button')
        submit.innerHTML = '确认'
        ui.appendChild(submit)
        submit.addEventListener('click', (ev: MouseEvent) => {
            let s = input.value
            let name = '没有名字的人'
            for (let i = 0; i < s.length; i++) {
                if (s.charAt(i) != ' ') {
                    name = s
                    break
                }
            }
            setPlayerID(name)
            callback()
            ui.remove()
        })
        document.body.appendChild(ui)
    }
}