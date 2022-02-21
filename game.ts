import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFile } from 'fs'
import { requestFile, xFile } from './server/requestFilter'
import { gameNetwork } from './server/gameStatus'

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Content-type,Content-Length,Authorization,Accept,X-Requested-Width")
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")

    let imageType = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'icon']
    let audioType = ['mp3', 'wav']
    let xType = ['map']
    let xTypeRel = ['map']
    let midPos: number = req.url.indexOf('?')
    if (midPos < 0) midPos = req.url.length
    let path: string = req.url.substring(1, midPos)
    let params: string = req.url.substring(midPos, req.url.length)
    let ftype: string = 'html'

    if (req.method == 'POST') {
        req.on('data', (data) => {
            res.end(gameNetwork.gotMsg(data))
        })
        req.on('error', (err: Error) => {
            console.log('Data from client error')
            res.end('timeout')
        })
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
    } else {
        if (path.length == 0) {
            path = 'index.html'
        } else {
            ftype = path.substring(path.lastIndexOf('.') + 1, path.length)
        }
        // console.log(`Request to ${path} (type: ${ftype}) with params [${params}]`)
    
        if (imageType.indexOf(ftype) >= 0) {
            readFile(path, null, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'text/plain')
                    res.end('404 No such file: ' + path)
                } else {
                    res.statusCode = 200
                    res.end(data)
                }
            })
        } else if (audioType.indexOf(ftype) >= 0) {
            console.log(path)
            readFile(path, null, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'text/plain')
                    res.end('404 No such file: ' + path)
                } else {
                    res.statusCode = 200
                    res.end(data)
                    console.log(path + ' respones')
                }
            })
        } else if (xType.indexOf(ftype) >= 0) {
            let relPath = path.substring(0, path.lastIndexOf('.')) + '.' + xTypeRel[xType.indexOf(ftype)]
            console.log(relPath)
            readFile(relPath, null, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'text/plain')
                    res.end('404 No such xfile' + relPath + ' (' + path + ')')
                } else {
                    res.statusCode = 200
                    res.end(xFile(data, ftype))
                }
            })
        } else {
            readFile(path, 'utf-8', (err: NodeJS.ErrnoException, data: string) => {
                if (err) {
                    res.statusCode = 404
                    res.setHeader('Content-Type', 'text/plain')
                    res.end('404 No such file: ' + path)
                } else {
                    let content = requestFile(data, ftype)
                    res.statusCode = 200
                    res.setHeader('Content-Type', content.type)
                    res.end(content.data)
                }
            })
        }
    }
})

gameNetwork.run()

server.listen(3000, '0.0.0.0', () => {
    console.log("Server running at http://127.0.0.1:3000")
})

