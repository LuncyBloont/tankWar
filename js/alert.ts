
let ialertDOM: HTMLDivElement
let ialertTime = 0
let ialertLerpTime = 1

function genAlert(dom: HTMLDivElement) {
    ialertDOM = dom
    dom.style.display = 'none'
    dom.style.zIndex = '1000'
    dom.style.transition = `opacity ${ialertLerpTime}s 0s ease`
    dom.style.opacity = '0.3'
    setInterval(() => {
        ialertTime -= 0.1
        if (ialertTime <= ialertLerpTime) {
            dom.style.opacity = '0.3'
        }
        if (ialertTime <= 0.) {
            ialertTime = 0.
            dom.style.display = 'none'
        }
    }, 100)
}

function ialert(s: string, time: number = 2) {
    ialertTime = Math.max(time, ialertTime)
    ialertDOM.style.display = 'inline-block'
    ialertDOM.style.opacity = '1'
    ialertDOM.innerHTML = s
}