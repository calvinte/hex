window.Map = (function() {
    Map.prototype = {
        generateTiles: function() {
            var coordinate;
            for (var y = -radius; y < radius; y++) {
                for (var x = -radius; x < radius; x++) {
                    coordinate = new Coordinate({y:y, x:x}, this);
                    if (coordinate.withinBoundaries()) {
                        this.tileDictionary[x] = this.tileDictionary[x] || {};
                        this.tileDictionary[x][y] = new Tile(coordinate, this);
                        this.tiles.push(this.tileDictionary[x][y]);
                    }
                }
            }
        },
        getTile: function(coordinate) {
            return this.tileDictionary[coordinate.x][coordinate.y];
        },
    };
    function Map(radius) {
        this.radius = radius;
        this.tiles = [];
        this.tileDictionary = {};
        this.generateTiles();
    };
    return Map;
}());

