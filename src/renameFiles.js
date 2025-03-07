const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const { v4: uuidv4 } = require('uuid')

const directoryPath = path.resolve(__dirname, '..', 'data')

const fileNames = fs.readdirSync(directoryPath)

fileNames.forEach(fileName => {
  const currentFilePath = path.resolve(directoryPath, fileName)

  const tags = NodeID3.read(currentFilePath)

  const newFileName = `${tags.title}___${tags.artist}___${uuidv4()}.${fileName.split('.').pop()}`
    .replaceAll("/", '')
    .replaceAll("\\", '')
    .replaceAll("?", '')
    .replaceAll("'", '')
    .replaceAll("\"", '')

  const newFilePath = path.resolve(directoryPath, newFileName)

  fs.renameSync(currentFilePath, newFilePath)
})
