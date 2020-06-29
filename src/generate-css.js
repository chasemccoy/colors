const fs = require('fs')
const path = require('path')
const outdent = require('outdent');
const colors = require('../dist/colors')

const generateCSS = () => {
  const destination = path.resolve(__dirname, '../dist/colors.css')

  const css = outdent`
    :root {
      ${Object.keys(colors).map(key => {
        return colors[key].map((color, index) => `--${key}-${index}: ${color};`).join('\n  ')
      }).join('\n  ')}
    }
  `

  fs.writeFile(destination, css, () => {
    console.log(`Wrote CSS to ${destination}`)
  })
}

generateCSS()