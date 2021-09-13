const layersOrder = [
    { name: 'BackgroundTop', number: 10 },
    { name: 'BackgroundBottom', number: 10 },
    { name: 'Accents', number: 11 },
    { name: 'Tables', number: 4 },
    { name: 'Walls', number: 7 },
    { name: 'Windows', number: 1 },
    { name: 'Shadows', number: 1 },
    { name: 'Bushes', number: 9 },
    { name: 'Hoses', number: 8 },
    { name: 'Glass Rail', number: 1 },
    { name: 'Chairs', number: 7 },
    { name: 'Umbrellas', number: 8 },
];

const format = {
    width: 1920,
    height: 1920
};

const rarity = [
    { key: "", val: "original" },
    { key: "_r", val: "rare" },
    { key: "_sr", val: "super rare" },
];

const defaultEdition = 800;

module.exports = { layersOrder, format, rarity, defaultEdition };