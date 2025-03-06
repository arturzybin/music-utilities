const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const { v4: uuidv4 } = require('uuid')

const fileNames = fs.readdirSync(path.resolve(__dirname, '..', 'data'))

for (const fileName of fileNames) {
  const currentPath = path.resolve(__dirname, '..', 'data', fileName)
  const tags = NodeID3.read(currentPath)

  const newName = `${tags.title}___${tags.artist}___${uuidv4()}.${fileName.split('.').pop()}`
  const newPath = path.resolve(__dirname, '..', 'data', newName)

  fs.renameSync(currentPath, newPath)
}
