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
        if (!coordinate.withinBoundaries()) {
            throw new Error('Out of bounds.');
        }

        return this;
    };

    return Tile;
}());

