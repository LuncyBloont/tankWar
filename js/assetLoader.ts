/// <reference path="./alert.ts" />
let assetTabel = {}

let assets = {}
let assetsNow = 0
let assetsTask = 0

function readAssetsTable(onloadfunc: Function) {
    const request = new XMLHttpRequest()
    request.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (request.status == 200) {
            assetTabel = JSON.parse(request.responseText)
            initAssets()
            waitAssetLoadDone(onloadfunc)
        } else {
            document.write('Game assets list config request error. <a href="127.0.0.1:3000/index.html">RETRY</a>')
        }
    })
    request.open('GET', './config/assets.json')
    request.send(null)
}

function waitAssetLoadDone(func: Function) {
    let wait = setInterval(() => {
        console.log('loading')
        ialert('Loading...' + Math.round(assetsNow / assetsTask * 100) + '%')
        if (assetsNow == assetsTask) {
            func()
            clearInterval(wait)
        }
    }, 500)
}

function loadOne(index: number, nameList: Array<string>) {
    if (index >= nameList.length) {
        console.log('All assets got!')
        return
    }
    let root: string = nameList[index].substring(0, nameList[index].indexOf('_'))
    let i = nameList[index]
    if (root == 'texture') {
        let img = new Image()
        img.addEventListener('load', (ev: Event) => {
            assets[i] = img
            assetsNow += 1
            console.log(assetTabel[i] + ' GOT!')
            loadOne(index + 1, nameList)
        })
        img.addEventListener('error', (ev: ErrorEvent) => {
            document.write('Web multimedia assets request error. <a href="127.0.0.1:3000/index.html">RETRY</a>')
        })
        img.src = assetTabel[i]
    }
    if (root == 'audio') {
        let adu = new Audio()
        adu.addEventListener('load', (ev: Event) => {
            assets[i] = adu
            assetsNow += 1
            console.log(assetTabel[i] + ' GOT!')
            loadOne(index + 1, nameList)
        })
        adu.addEventListener('error', (ev: ErrorEvent) => {
            document.write('Game multimedia assets request error. <a href="127.0.0.1:3000/index.html">RETRY</a>')
        })
        adu.src = assetTabel[i]
    }
    if (root == 'config') {
        const confRequire = new XMLHttpRequest()
        confRequire.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
            if (confRequire.status == 200) {
                assets[i] = JSON.parse(confRequire.response)
                assetsNow += 1
                console.log(assetTabel[i] + ' GOT!')
                loadOne(index + 1, nameList)
            } else {
                document.write('failed to reqest config assets. <a href="127.0.0.1:3000/index.html">RETRY</a>')
            }
        })
        confRequire.open('GET', assetTabel[i])
        confRequire.send(null)
    }
    if (root == 'text' || root == 'shader' || root == 'model') {
        const request = new XMLHttpRequest()
        request.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
            if (request.status == 200) {
                assets[i] = request.response
                assetsNow += 1
                console.log(assetTabel[i] + ' GOT!')
                loadOne(index + 1, nameList)
            } else {
                document.write('Game assets request error <a href="127.0.0.1:3000/index.html">RETRY</a>')
            }
        })
        request.open('GET', assetTabel[i])
        request.send(null)
    }
    if (root == 'map') {
        const request = new XMLHttpRequest()
        request.responseType = 'arraybuffer'
        request.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
            if (request.status == 200) {
                assets[i] = new Uint8Array(request.response)
                let arr: Uint8Array = assets[i]
                console.log(arr)
                assetsNow += 1
                console.log(assetTabel[i] + ' GOT!')
                loadOne(index + 1, nameList)
            } else {
                document.write('Game assets request error <a href="127.0.0.1:3000/index.html">RETRY</a>')
            }
        })
        request.open('GET', assetTabel[i])
        request.send(null)
    }
}

function initAssets() {
    assetsNow = 0
    assetsTask = 0
    let nameList: Array<string> = []
    for (let i in assetTabel) {
        assetsTask += 1
        nameList.push(i)
    }
    loadOne(0, nameList)
}

function cLoadAsset(onload: Function) {
    readAssetsTable(onload)
}