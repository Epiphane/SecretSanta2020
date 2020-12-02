const http = require('http');
const fs = require('fs');

const basedir = __dirname;

function serveStatResult(res, path, err) {
    if (err) {
        if (err.code === 'ENOENT') {
            res.statusCode = 404;
            res.write('Not Found');
            res.end();
        }
        else {
            res.statusCode = 500;
            res.write(err.message);
            res.end();
        }
    }
    else {
        fs.readFile(path, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.write(err.message);
                res.end();
            }
            else {
                if (path.indexOf('.js') >= 0) {
                    res.setHeader('Content-Type', 'application/json');
                }

                res.write(data);
                res.end();
            }
        });
    }
}

http.createServer(function (req, res) {
    const path = basedir + req.url;
    fs.stat(path, (err, stat) => {
        if (!err && stat.isDirectory()) {
            const subpath = path + 'index.html';
            fs.stat(subpath, (err) => serveStatResult(res, subpath, err));
        }
        else {
            serveStatResult(res, path, err);
        }
    })
}).listen(8080);
