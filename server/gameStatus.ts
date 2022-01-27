
export namespace gameNetwork {

    const lifeTime = 5
    const statusList = {}
    const lifeList = {}
    const timeList = {}

    export function run() {
        setInterval(() => {
            for (let i in lifeList) {
                lifeList[i] -= 1
                if (lifeList[i] <= 0) {
                    console.log(`A old status removed. (${i})`)
                    delete lifeList[i]
                    delete statusList[i]
                    delete timeList[i]
                }
            }
        }, 1000)
    }

    export function gotMsg(data: Buffer) {
        let nsts: any
        try {
            nsts = JSON.parse(data.toString())
            let respList = []
            if (!statusList[nsts.owner]) {
                console.log(`New status added. (${nsts.owner})`)
            } else {
                if (nsts.time < timeList[nsts.owner]) {
                    console.log(`    A old bag come. (${nsts.owner})`)
                    return 'timeout'
                }
            }
            if (nsts.owner && nsts.body) {
                lifeList[nsts.owner] = lifeTime
                statusList[nsts.owner] = nsts.body
                timeList[nsts.owner] = nsts.time
            }

            for (let i in statusList) {
                if (i != nsts.owner) {
                    respList.push(statusList[i])
                }
            }

            let responseBag = {
                'time': nsts.time,
                'serverTime': Date.now(),
                'list': respList
            }

            return JSON.stringify(responseBag)
        } catch (err) {
            return 'timeout'
        }
    }
}