const path = require('path');
const fs = require('fs');
const readline = require('readline');
const rootPath = path.resolve(__dirname, '..');
const workPath = path.resolve(rootPath, 'dist');
const distFileName = 'ixa-helper.user.js';
const VERSION_REGEX = /\d+.\d+.\d+/m
const stage = process.env.STAGE;

// fs.exists(path.resolve(workPath, distFileName), r => {
//     if (r) return;
const src = path.resolve(rootPath, distFileName);
const target = path.resolve(workPath, distFileName);
try {
  //bump up user script version
  fs.readFile(src, 'utf8', (err, data) => {
    if(err){
      return console.log(err)
    }
    const result = data.replace(VERSION_REGEX, bumpVersion(data.match(VERSION_REGEX)))
    fs.writeFile(src, result, 'utf8', (err) => {
      if(err) {
        return console.log(err)
      }
    })
  })
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

//version naming convention, major.minor.patch
//major is for breaking change, no plan for this for now
const bumpVersion = (matchedString) => {
  if(matchedString) {
    const version = matchedString[0].split('.').map(num => parseInt(num, 10));
    console.log(stage)
    if(stage === 'release') {
      //update minor version
      version[1]++
    } else {
      version[2]++
    }
    return version.join('.')
  }
}

console.info('plugin file genarate done.');