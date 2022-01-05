
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
            document.write('Game assets list config request error.')
        }
    })
    request.open('get', './config/assets.json')
    request.send(null)
}

function waitAssetLoadDone(func: Function) {
    let wait = setInterval(() => {
        console.log('loading')
        if (assetsNow == assetsTask) {
            func()
            clearInterval(wait)
            console.log(assets)
        }
    }, 500)
}

function initAssets() {
    assetsNow = 0
    assetsTask = 0
    for (let i in assetTabel) {
        assetsTask += 1
        let root: string = i.substring(0, i.indexOf('_'))
        if (root == 'texture') {
            let img = new Image()
            img.addEventListener('load', (ev: Event) => {
                assets[i] = img
                assetsNow += 1
                console.log(assetTabel[i] + ' GOT!')
            })
            img.addEventListener('error', (ev: ErrorEvent) => {
                document.write('Web multimedia assets request error.')
            })
            img.src = assetTabel[i]
        }
        if (root == 'audio') {
            let adu = new Audio()
            adu.addEventListener('load', (ev: Event) => {
                assets[i] = adu
                assetsNow += 1
                console.log(assetTabel[i] + ' GOT!')
            })
            adu.addEventListener('error', (ev: ErrorEvent) => {
                document.write('Game multimedia assets request error.')
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
                } else {
                    document.write('failed to reqest config assets.')
                }
            })
            confRequire.open('get', assetTabel[i])
            confRequire.send(null)
        }
        if (root == 'text' || root == 'shader' || root == 'model') {
            const request = new XMLHttpRequest()
            request.addEventListener('load', (ev: ProgressEvent<XMLHttpRequestEventTarget>) => {
                if (request.status == 200) {
                    assets[i] = request.response
                    assetsNow += 1
                    console.log(assetTabel[i] + ' GOT!')
                } else {
                    document.write('Game assets request error')
                }
            })
            request.open('get', assetTabel[i])
            request.send(null)
        }
    }
}

function cLoadAsset(onload: Function) {
    readAssetsTable(onload)
}