define([], function() {
    function Map(radius) {
        this.radius = radius;
        this.width = 1 + this.radius * 2;
    };

    Map.prototype = {
        // @note two of [q, r, s] required
        // @note when all parameters provided: (q + r + s === 0)
        resolveTile: function(q, r, s) {
            var coordinates = null;
            return [
                typeof q === 'number' ? q % this.width : (-r - s) % this.width,
                typeof r === 'number' ? r % this.width : (-q - s) % this.width,
                typeof s === 'number' ? s % this.width : (-q - r) % this.width
            ];
        },
        // @param rotation as number between 0 and 5.
        computeRotation: function(coordinate, center, rotation) {
            var i, direction = 1;
            var rotation = [
                coordinate[0] - center[0],
                coordinate[1] - center[1],
                coordinate[2] - center[2]
            ];

            if (rotation > 5) {
                rotation = rotation % 5;
            }

            if (rotation > 2) {
                direction = -1;
                rotation -= 3;
            }

            if (direction > 0) {
                for (i = 0; i < direction; i++) {
                    rotation = [
                        -rotation[2],
                        -rotation[0],
                        -rotation[1]
                    ];
                    
                }
            } else {
                for (i = 0; i > direction; i--) {
                    rotation = [
                        -rotation[1],
                        -rotation[2],
                        -rotation[0]
                    ];
                }
            }

            return this.resolveTile(
                center[0] + rotation[0],
                center[1] + rotation[1],
                center[2] + rotation[2]
            );
        },
    };

    return Map;
});

