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

let metadata = [];
let attributes = [];
let hash = [];
let decodedHash = [];
let createdHashes = [];
if (fs.existsSync('hashes.txt')) {
  var existingHashes = fs.readFileSync('hashes.txt').toString().split("\n");
  console.log(existingHashes);
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
  let element =
    _layer.elements[Math.floor(rand * _layer.number)] ? _layer.elements[Math.floor(rand * _layer.number)] : null;
  if (element) {
    addAttributes(element, _layer);
    const image = await loadImage(`${_layer.location}${element.fileName}`);
    if (Object.values(createdHashes).includes(metadata[_edition - 1].hash)) {
      console.log("Hash " + metadata[_edition - 1].hash + " already exists! Skipping.")
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

  for (let i = 1; i <= edition; i++) {
    layers.forEach((layer) => {
      drawLayer(layer, i);
    });
    addMetadata(i);
    //console.log(metadata);
    if (existingHashes) {
      if (existingHashes.includes(metadata[i - 1].hash)) {
        console.log("Hash " + metadata[i - 1].hash + " already exists! Skipping.")
      }
      else {
        createdHashes.push({ hash: metadata[i - 1].hash, created: 1 })
        //console.log(createdHashes);
        console.log("Creating edition " + i);
      }
    }
  }
  // console.log("end createFiles")
};

const createMetaData = () => {
  // console.log("begin createMetaData")
  fs.stat(`${buildDir}/${metDataFile}`, (err) => {
    if (err == null || err.code === 'ENOENT') {
      fs.writeFileSync(`${buildDir}/${metDataFile}`, JSON.stringify(metadata, null, 2));
      var stream = fs.createWriteStream("hashes.txt", { flags: 'a' });
      for (const hash in metadata) {
        stream.write(metadata[hash].hash);
        stream.write('\n');
      }
      stream.end();
    } else {
      console.log('Oh no, error: ', err.code);
    }
  });

  // console.log("end createMetaData")
};

module.exports = { buildSetup, createFiles, createMetaData };
