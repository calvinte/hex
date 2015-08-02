window.Map = (function() {
    Map.prototype = {
        withinBoundaries: function(coordinate) {
            return _(Coordinate.prototype.axes).every(function(v) { return Math.abs(coordinate[v]) < this.radius; }, this);
        },
        generateTiles: function() {
            var coordinate;
            for (var y = -radius; y < radius; y++) {
                for (var x = -radius; x < radius; x++) {
                    coordinate = new Coordinate({y:y, x:x});
                    if (this.withinBoundaries(coordinate)) {
                        this.tileMap[x] = this.tileMap[x] || {};
                        this.tileMap[x][y] = new Tile(coordinate, this);
                        this.tiles.push(this.tileMap[x][y]);
                    }
                }
            }
        },
    };
    function Map(radius) {
        this.radius = radius;
        this.tiles = [];
        this.tileMap = {};
        this.generateTiles();
    };
    return Map;
}());

