window.Tile = (function() {
    Tile.prototype = {
        satisfyCoordinates: function() {
        },
    };
    /**
    * Function returns tile at provided coordinate.
    * @param coordinate as Object.
    * @return Tile.
    */
    function Tile(coordinate, map) {
        this.coordinate = coordinate;

        // Bounds.
        if (!map.withinBoundaries(this.coordinate)) {
            throw new Error('Out of bounds.');
        }

        return this;
    };

    return Tile;
}());

