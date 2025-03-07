const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const sharp = require('sharp')

const compressedFiles = []
const errors = []

main().then(() => {
  console.log('Done!')
  console.log('='.repeat(100))
  console.log(`Errors:`)
  console.log(errors)
  console.log('='.repeat(100))
  console.log('Summary:')
  console.log(`${compressedFiles.length} file${compressedFiles.length === 1 ? '' : 's'} compressed`)
  console.log(`${errors.length} file${errors.length === 1 ? '' : 's'} caused errors at some point during compression`)
})

async function main() {
  const fileNames = fs.readdirSync(path.resolve(__dirname, '..', 'data'))

  for (const fileName of fileNames) {
    console.log(`Working on "${fileName}"`)

    const filePath = path.resolve(__dirname, '..', 'data', fileName)
    const tags = NodeID3.read(filePath)

    if (!tags.image) {
      errors.push(`"${fileName}": doesn't have an image`)
      return
    }

    if (typeof tags.image === 'string') {
      errors.push(`"${fileName}": an image isn't a buffer`)
      return
    }

    await sharp(tags.image.imageBuffer)
      .png({ compressionLevel: 9 })
      .toBuffer()
      .then((buffer) => {
        NodeID3.update({ image: { ...tags.image, mime: 'image/png', imageBuffer: buffer } }, filePath)
      })
      .then(() => {
        compressedFiles.push(fileName)
      })
      .catch((e) => {
        errors.push(`"${fileName}": error during image manipulations: ${e}`)
      })
  }
}
