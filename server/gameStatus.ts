
export namespace gameNetwork {

    const lifeTime = 5
    const statusList = {}
    const lifeList = {}

    export function run() {
        setInterval(() => {
            for (let i in lifeList) {
                lifeList[i] -= 1
                if (lifeList[i] <= 0) {
                    delete lifeList[i]
                    delete statusList[i]
                    console.log('A old status removed.')
                }
            }
        }, 1000)
    }

    export function gotMsg(data: Buffer) {
        let nsts = JSON.parse(data.toString())
        let respList = []
        if (!statusList[nsts.owner]) {
            console.log('New status added.')
        }
        if (nsts.owner && nsts.body) {
            lifeList[nsts.owner] = lifeTime
            statusList[nsts.owner] = nsts.body
        }

        for (let i in statusList) {
            if (i != nsts.owner) {
                respList.push(statusList[i])
            }
        }

        return JSON.stringify(respList)
    }
}