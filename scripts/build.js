const path = require('path');
const fs = require('fs');
const rootPath = path.resolve(__dirname, '..');
const workPath = path.resolve(rootPath, 'dist');
const distFileName = 'ixa-helper.user.js';

// fs.exists(path.resolve(workPath, distFileName), r => {
//     if (r) return;
const src = path.resolve(rootPath, distFileName);
const target = path.resolve(workPath, distFileName);
try {
    fs.copyFileSync(src, target);
} catch (Exception) {
    // nothing to do 
}

fs.readFile(path.resolve(workPath, 'main.js'), (err, data) => {
    if (err) throw err;
    fs.open(target, 'a', (err, fd) => {
        fs.appendFile(fd, data, err => {
            if (err) throw err
        })
    })
})
// })

console.info('plugin file genarate done.');