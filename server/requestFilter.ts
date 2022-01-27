
export function xFile(data: Buffer, type: string) {
    if (type == 'map') {
        return data
    }
}

export function requestFile(data: string, type: string): { type: string, data: string } {
    let textType: string = ''
    switch (type) {
        case 'html':
            textType = 'text/html'
            break
        case 'js':
            textType = 'text/javascript'
            break
        case 'css':
            textType = 'text/css'
            break
        case 'json':
            textType = 'text/json'
            break
        default:
            textType = 'text/plain'
            data = customFormat(data, type)
    }
    return { type: textType, data: data }
}

function customFormat(data: string, type: string): string {
    switch (type) {
        case 'obj':
            return loadObj2JSON(data)
        default:
            return data
    }
}

function loadObj2JSON(data: string): string {
    let lines: string[] = data.split('\n')
    let json: string[] = ['{']

    let vs: string[] = []
    let ts: string[] = []
    let ns: string[] = []

    let vinfo: string[] = []

    let fs: string[] = []

    for (let l in lines) {
        let tokens = lines[l].split(' ')
        if (lines[l][0] == 'v') {
            if (lines[l][1] == 't') {
                ts.push(`${parseFloat(tokens[1])},${parseFloat(tokens[2])}`)
            } else if (lines[l][1] == 'n') {
                ns.push(`${parseFloat(tokens[1])},${parseFloat(tokens[2])},${parseFloat(tokens[3])}`)
            } else {
                vs.push(`${parseFloat(tokens[1])},${parseFloat(tokens[2])},${parseFloat(tokens[3])}`)
            }
        } else if (lines[l][0] == 'f') {
            fs.push('')
            for (let fi = 1; fi < tokens.length; fi++) {
                let id_uv_normal = tokens[fi].split('/')
                let id: number = parseInt(id_uv_normal[0]) - 1
                let uv: number = parseInt(id_uv_normal[1]) - 1
                let normal: number = parseInt(id_uv_normal[2]) - 1
                let fvid = vinfo.length
                vinfo.push(vs[id] + ',' + ts[uv] + ',' + ns[normal])
                if (fs[fs.length - 1].length > 0) fs[fs.length - 1] += ','
                fs[fs.length - 1] += fvid
            }
        }
    }

    json.push('"vertex":[')
    for (let i = 0; i < vinfo.length; i++) {
        let onev = ''
        if (i != 0) onev = ','
        json.push(onev + vinfo[i])
    }
    json.push('],')

    json.push('"face":[')
    for (let i = 0; i < fs.length; i++) {
        let onef = ''
        if (i != 0) onef = ','
        json.push(onef + '[' + fs[i] + ']')
    }
    json.push(']')

    json.push('}')
    return json.join('')
}
