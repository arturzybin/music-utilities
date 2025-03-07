const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const sharp = require('sharp')

const croppedFiles = []
const untouchedFiles = []
const errors = []

main().then(() => {
  console.log('Done!')
  console.log('='.repeat(100))
  console.log(`Untouched files:`)
  console.log(untouchedFiles)
  console.log('='.repeat(100))
  console.log(`Errors:`)
  console.log(errors)
  console.log('='.repeat(100))
  console.log('Summary:')
  console.log(`${croppedFiles.length} file${croppedFiles.length === 1 ? '' : 's'} cropped`)
  console.log(`${untouchedFiles.length} file${untouchedFiles.length === 1 ? '' : 's'} left untouched as dimensions were already right`)
  console.log(`${errors.length} file${errors.length === 1 ? '' : 's'} caused errors at some point during manipulations`)
})

async function main() {
  const directoryPath = path.resolve(__dirname, '..', 'data')
  const fileNames = fs.readdirSync(directoryPath)

  for (const fileName of fileNames) {
    console.log(`Working on "${fileName}"`)

    const filePath = path.resolve(directoryPath, fileName)
    const tags = NodeID3.read(filePath)

    if (!tags.image) {
      errors.push(`"${fileName}": doesn't have an image`)
      continue
    }

    if (typeof tags.image === 'string') {
      errors.push(`"${fileName}": an image isn't a buffer`)
      continue
    }

    const sharpObject = sharp(tags.image.imageBuffer)

    await sharpObject
      .metadata()
      .then((metadata) => {
        const { width, height } = metadata

        if (!width || !height) {
          errors.push(`"${fileName}": couldn't extract image width or height`)
          return
        }

        if (width === height) {
          untouchedFiles.push(fileName)
          return
        }

        const sideLength = Math.min(width, height)

        const left = (width - sideLength) / 2
        const top = (height - sideLength) / 2

        return sharpObject
          .extract({ width: sideLength, height: sideLength, left, top })
          .toBuffer()
          .then((buffer) => {
            NodeID3.update({ image: { ...tags.image, imageBuffer: buffer } }, filePath)
          })
          .then(() => {
            croppedFiles.push(fileName)
          })
      })
      .catch((e) => {
        errors.push(`"${fileName}": error during image manipulations: ${e}`)
      })
  }
}
