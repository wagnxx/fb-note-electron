const http = require('http')


const server = http.createServer((req, res) => {
    res.end('okkkk')
})
let port = 9090
let host = '0.0.0.0'
server.listen(port, host)