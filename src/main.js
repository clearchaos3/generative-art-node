const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const console = require("console");
const { layersOrder, format, rarity } = require("./config.js");

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

if (!process.env.PWD) {
  process.env.PWD = process.cwd();
}

const buildDir = `${process.env.PWD}/build`;
const metDataFile = '_metadata.json';
const layersDir = `${process.env.PWD}/layers`;


function isEmpty(path) {
  return fs.readdirSync(path).length <= 1;
}

const firstRun = isEmpty(buildDir);

let metadata = [];
let attributes = [];
let hash = [];
let decodedHash = [];
if (fs.existsSync('hashes.txt')) {
  var existingHashes = fs.readFileSync('hashes.txt').toString().split("\n");
  console.log(existingHashes);
}
else {
  var existingHashes = [];
}

const addRarity = _str => {
  let itemRarity;

  rarity.forEach((r) => {
    if (_str.includes(r.key)) {
      itemRarity = r.val;
    }
  });

  return itemRarity;
};

const cleanName = _str => {
  let name = _str.slice(0, -4);
  rarity.forEach((r) => {
    name = name.replace(r.key, "");
  });
  return name;
};

const getElements = path => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index + 1,
        name: cleanName(i),
        fileName: i,
        rarity: addRarity(i),
      };
    });
};

const layersSetup = layersOrder => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    name: layerObj.name,
    location: `${layersDir}/${layerObj.name}/`,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    position: { x: 0, y: 0 },
    size: { width: format.width, height: format.height },
    number: layerObj.number
  }));

  return layers;
};

const buildSetup = () => {
  // console.log("begin buildSetup")
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  // console.log("end buildSetup")
};


let editionStartIndex = (Object.keys(existingHashes).length > 0 ? Object.keys(existingHashes).length - 1 : Object.keys(existingHashes).length);

let editionIndex = editionStartIndex;
console.log("edition start index: ", editionStartIndex);

const saveLayer = (_canvas, _edition) => {
  fs.writeFileSync(`${buildDir}/${_edition}.png`, _canvas.toBuffer("image/png"));
};

const addMetadata = _edition => {
  let dateTime = Date.now();
  let tempMetadata = {
    hash: hash.join(""),
    decodedHash: decodedHash,
    edition: _edition,
    date: dateTime,
    attributes: attributes,
  };
  metadata.push(tempMetadata);
  attributes = [];
  hash = [];
  decodedHash = [];
};

const addAttributes = (_element, _layer) => {
  let tempAttr = {
    id: _element.id,
    layer: _layer.name,
    name: _element.name,
    rarity: _element.rarity,
  };
  attributes.push(tempAttr);
  hash.push(_layer.id);
  hash.push(_element.id);
  decodedHash.push({ [_layer.id]: _element.id });
};

const drawLayer = async (_layer, _edition) => {
  const rand = Math.random();
  let currentIndex = editionIndex - editionStartIndex;
  // console.log(editionStartIndex);
  let element =
    _layer.elements[Math.floor(rand * _layer.number)] ? _layer.elements[Math.floor(rand * _layer.number)] : null;
  if (element) {
    addAttributes(element, _layer);
    const image = await loadImage(`${_layer.location}${element.fileName}`);
    if (Object.values(existingHashes).includes(metadata[currentIndex].hash)) {
      console.log("Hash " + metadata[currentIndex].hash + " already exists! Skipping.")
    }
    else {
      ctx.drawImage(
        image,
        _layer.position.x,
        _layer.position.y,
        _layer.size.width,
        _layer.size.height
      );
      saveLayer(canvas, _edition);
    }
  }
};

const createFiles = edition => {
  // console.log("begin createFiles")
  const layers = layersSetup(layersOrder);
  //console.log(layers);
  console.log("edition Start Index: ", editionStartIndex);

  let editionEndIndex = editionStartIndex + edition;
  console.log("edition End Index: ", editionEndIndex);

  for (let i = 1; i <= edition; i++) {
    //first run
    layers.forEach((layer) => {
      drawLayer(layer, editionIndex);
    });
    addMetadata(i);
    console.table(metadata);
    existingHashes.push({ hash: metadata[i - 1].hash, created: 1 })
    console.log("Creating edition " + i);
    editionIndex++;
  }
  // console.log("end createFiles")
};

const createMetaData = () => {
  // console.log("begin createMetaData")
  fs.stat(`${buildDir}/${metDataFile}`, (err) => {
    if (err == null || err.code === 'ENOENT') {
      // fs.writeFileSync(`${buildDir}/${metDataFile}`,);
      var metDataFileStream = fs.createWriteStream(`${buildDir}/${metDataFile}`, { flags: 'a' });
      metDataFileStream.write(JSON.stringify(metadata, null, 2));
      metDataFileStream.end();
      var hashFileStream = fs.createWriteStream("hashes.txt", { flags: 'a' });
      for (const hash in metadata) {
        hashFileStream.write(metadata[hash].hash);
        hashFileStream.write('\n');
      }
      hashFileStream.end();
    } else {
      console.log('Oh no, error: ', err.code);
    }
  });

  // console.log("end createMetaData")
};

module.exports = { buildSetup, createFiles, createMetaData };
