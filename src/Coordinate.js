Coordinate = (function() {
    Coordinate.prototype = {
        axes: ['w', 'x', 'y'],
    };
    function Coordinate(coordinate) {
        var missingAxis;
        var _coordinate = _(coordinate);
        var coordinateLength = _coordinate.size();

        _(coordinate).each(function(v, k) {
            var direction = v > 0;
            var wholeAbs = Math.floor(Math.abs(v));
            coordinate[k] = (direction ? 1 : -1) * wholeAbs;
        });

        // Ensure at least two axes were provided.
        if (coordinateLength < 2) {
            throw new Error('Specify at least two of ' + JSON.stringify(['w', 'x', 'y']) + '.');
        }

        // Only allow acceptable axes.
        if (!_coordinate.every(function(v, k) { return this.axes.indexOf(k) >= 0 }, this)) {
            throw new Error('Unexpected axis in coordinate. Only acceptable values are ' + JSON.stringify(['w', 'x', 'y']) + '.');
        }

        // If only two axes were passed, discover the value of the third.
        if (coordinateLength < 3) {
            missingAxis = _(this.axes).filter(function(v) { return typeof coordinate[v] == 'undefined' })[0];
            coordinate[missingAxis] = -1 * _coordinate.reduce(function(memo, num) { return memo + num });
        }

        // Ensure all values add up to 0.
        if (_coordinate.reduce(function(memo, num) { return memo + num }) != 0) {
            throw new Error('Invalid coordinate specified. All axes should add up to 0.');
        }

        _.extend(this, coordinate);
    };
    return Coordinate;
}());

