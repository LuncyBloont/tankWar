/// <reference path="./gameLogic.ts" />

namespace player {
    export let playerID: string = ''
    export function setPlayerID(name: string) {
        playerID = name + '>>$<<' + localTime().toString(16)
    }

    export let version = 'error'

    export const messageList: Array<string> = []

    export function getIDByUI(callback: Function) {
        let ui = document.createElement('div')
        ui.className = 'centerTips ui'
        ui.style.background = '#ACB1AF'
        ui.innerHTML = '输入你的昵称（仅限字母和数字）：<br />'
        let input = document.createElement('input')
        ui.appendChild(input)
        let submit = document.createElement('button')
        submit.innerHTML = '确认'
        ui.appendChild(submit)
        submit.addEventListener('click', (ev: MouseEvent) => {
            let s = input.value
            let name = 'unknown' + Math.floor(Math.random() * 100000.)
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