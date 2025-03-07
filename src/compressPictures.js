const fs = require('fs')
const path = require('path')
const NodeID3 = require('node-id3')
const sharp = require('sharp')

const compressedFiles = []
const jpegFiles = []
const untouchesPngFiles = []
const errors = []

main().then(() => {
  console.log('Done!')
  console.log('='.repeat(100))
  console.log(`Untouched .jpeg/.jpg files:`)
  console.log(jpegFiles)
  console.log('='.repeat(100))
  console.log(`Untouched .png files:`)
  console.log(untouchesPngFiles)
  console.log('='.repeat(100))
  console.log(`Errors:`)
  console.log(errors)
  console.log('='.repeat(100))
  console.log('Summary:')
  console.log(`${compressedFiles.length} file${compressedFiles.length === 1 ? '' : 's'} compressed`)
  console.log(`${jpegFiles.length} file${jpegFiles.length === 1 ? '' : 's'} left untouched as they are in .jpeg/.jpg format`)
  console.log(`${untouchesPngFiles.length} file${untouchesPngFiles.length === 1 ? '' : 's'} in .png format left untouched because compression didn't reduce the size`)
  console.log(`${errors.length} file${errors.length === 1 ? '' : 's'} caused errors at some point during compression`)
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

    if (tags.image.mime === 'image/jpeg') {
      jpegFiles.push(fileName)
      continue
    }

    if (tags.image.mime === 'image/png') {
      await sharp(tags.image.imageBuffer)
        .png({ compressionLevel: 9 })
        .toBuffer()
        .then((bufferAfterCompression) =>
          Promise.all([sharp(tags.image.imageBuffer).metadata(), sharp(bufferAfterCompression).metadata()])
            .then(([initialMetadata, metadataAfterCompression]) => {
              if (metadataAfterCompression.size < initialMetadata.size) {
                NodeID3.update({ image: { ...tags.image, mime: 'image/png', imageBuffer: bufferAfterCompression } }, filePath)
                compressedFiles.push(fileName)
              } else {
                untouchesPngFiles.push(fileName)
              }
            })
        )
        .catch((e) => {
          errors.push(`"${fileName}": error during image manipulations: ${e}`)
        })

      continue
    }

    await sharp(tags.image.imageBuffer)
      .png({ compressionLevel: 9 })
      .toBuffer()
      .then((buffer) => {
        NodeID3.update({ image: { ...tags.image, mime: 'image/png', imageBuffer: buffer } }, filePath)
        compressedFiles.push(fileName)
      })
      .catch((e) => {
        errors.push(`"${fileName}": error during image manipulations: ${e}`)
      })
  }
}
