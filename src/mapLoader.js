const tmx = require('tmx-parser');

async function loadMap() {
    const map = await new Promise((resolve, reject) => {
        tmx.parseFile("./src/map.tmx", function(err, loadedMap) {
            if (err) return reject(err);
            resolve(loadedMap);
        });
    })
    
    const layer = map.layers[0];
    const groundTiles = layer.tiles;
    const ground2D = [];
    
    for (let row = 0; row < map.height; row++) {
        const groundRow = [];
        for ( let col = 0; col < map.width; col++ ) {
            const groundTile = groundTiles[row * map.height + col];
            groundRow.push({ id: groundTile.id, gid: groundTile.gid });
        }
        ground2D.push(groundRow);
    }
    return ground2D;
}

module.exports = loadMap;