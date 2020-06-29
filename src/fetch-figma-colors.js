const dotenv = require('dotenv');
dotenv.config();

const {
  PAGE_ID,
  TEAM_ID,
  FILE_KEY,
  FIGMA_PERSONAL_TOKEN
} = process.env;

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

if (!FIGMA_PERSONAL_TOKEN) {
  console.error('No environment configured.');
  process.exit(1);
}

const doFetch = (url) =>
  fetch(`https://api.figma.com/v1${url}`, {
    headers: {
      'X-Figma-Token': FIGMA_PERSONAL_TOKEN
    }
  })
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }

    return res.json();
  })
  .then((json) => {
    if (json.error || (json.status && json.status !== 200)) {
      throw new Error(
        json.error || `Status ${json.status}: ${json.err}`
      );
    }

    return json;
  });

const fetchStyles = async(teamId) => {
  const json = await doFetch(`/teams/${teamId}/styles?page_size=99`);

  return json.meta.styles;
};

const fetchFile = async(key) => await doFetch(`/files/${key}`);

const fetchStyle = async(key) => await doFetch(`/styles/${key}`);

const getColorsFromObjects = (colorSwatches) => {
  return colorSwatches.map(swatch => {
    return swatch.fills.map(fill => {
      const { r, g, b } = fill.color;
      const rgbColor = `rgb(${[(r * 255 << 0), (g * 255 << 0), (b * 255 << 0)].join(',')})`;

      return rgbColor
    })[0]
  })
}

const fetchAllColorStyles = async () => {
  const styles = await fetchStyles(TEAM_ID);
  const file = await fetchFile(FILE_KEY);

  const canvas = file.document.children.find((page) => page.id === PAGE_ID);

  const colorSwatches = canvas && canvas.children
    .filter(child => child.type === 'FRAME')
    .reduce((acc, frame) => {
      const swatches = frame.children.filter(object => object.type === 'RECTANGLE')
      acc[frame.name.toLowerCase()] = getColorsFromObjects(swatches)
      return acc
    }, {})

  return colorSwatches
};

const writeColorsFromFigma = async () => {
  const styles = await fetchAllColorStyles();

  if (!styles) {
    throw new Error('No styles found');
  }

  const fileContents = `/* Updated at ${new Date().toUTCString()}*/\nmodule.exports = ${JSON.stringify(styles, null, 2)}`;

  const destination = path.resolve(__dirname, '../dist/colors.js')

  fs.writeFile(destination, fileContents, () => {
    console.log(`Wrote styles to ${destination}`);
  });
};

writeColorsFromFigma().catch(console.error);