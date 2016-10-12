define([], function() {
    function Map(radius) {
        this.radius = radius;
    };

    Map.prototype = {
        completeTile: function(q, r, s) {
            return [
                typeof q === 'number' ? q : (-r - s),
                typeof r === 'number' ? r : (-q - s),
                typeof s === 'number' ? s : (-q - r)
            ]
        },
        // @note two of [q, r, s] required
        // @note when all parameters provided: (q + r + s === 0)
        resolveTile: function(q, r, s) {
            var resolution = null;
            var position = this.completeTile(q, r, s);

            if (Math.abs(position[0]) > this.radius || Math.abs(position[1]) > this.radius || Math.abs(position[2]) > this.radius) {
                resolution = [null, null, null];

                if (position[0] < -this.radius && position[1] > this.radius) {
                    // [MIN, MAX, X]
                    resolution[0] = position[0] + this.radius * 2 + 1,
                    resolution[1] = position[1] + this.radius * -1 - 1
                } else if (position[0] < -this.radius && position[2] > this.radius) {
                    // [MIN, X, MAX]
                    resolution[0] = position[0] + this.radius + 1,
                    resolution[2] = position[2] + this.radius * -2 - 1
                } else if (position[1] < -this.radius && position[0] > this.radius) {
                    // [MAX, MIN, X]
                    resolution[0] = position[0] + this.radius * -2 - 1,
                    resolution[1] = position[1] + this.radius + 1
                } else if (position[1] < -this.radius && position[2] > this.radius) {
                    // [X, MIN, MAX]
                    resolution[1] = position[1] + this.radius * 2 + 1,
                    resolution[2] = position[2] + this.radius * -1 - 1
                } else if (position[2] < -this.radius && position[0] > this.radius) {
                    // [MAX, X, MIN]
                    resolution[0] = position[0] + this.radius * -1 - 1,
                    resolution[2] = position[2] + this.radius * 2 + 1
                } else if (position[2] < -this.radius && position[1] > this.radius) {
                    // [X, MAX, MIN]
                    resolution[1] = position[1] + this.radius * -2 - 1,
                    resolution[2] = position[2] + this.radius + 1
                } else if (position[0] > this.radius) {
                    // [MAX, X, X]
                    resolution[0] = position[0] + this.radius * -2 + 1;
                } else if (position[0] < -this.radius) {
                    // [MIN, X, X]
                    resolution[0] = position[0] + this.radius * 2 + 1;
                } else if (position[1] > this.radius) {
                    // [X, MAX, X]
                    resolution[1] = position[1] + this.radius * -2 - 1;
                } else if (position[1] < -this.radius) {
                    // [X, MIN, X]
                    resolution[1] = position[1] + this.radius * 2 + 1;
                } else if (position[2] > this.radius) {
                    // [X, X, MAX]
                    resolution[2] = position[2] + this.radius * -2 + 1;
                } else if (position[2] < -this.radius) {
                    // [X, X, MIN]
                    resolution[2] = position[2] + this.radius * 2 + 1;
                }
            }

            if (resolution && _.reject(resolution, _.isNull).length < 2) {
                // Only one axis was out of bounds.
                if (resolution[0] !== null) {
                    return this.completeTile(
                        resolution[0],
                        -position[1]
                    );
                } else if (resolution[1] !== null) {
                    return this.completeTile(
                        -position[0],
                        resolution[1]
                    );
                } else if (resolution[2] !== null) {
                    return this.completeTile(
                        null,
                        -position[1] - 1,
                        resolution[2]
                    );
                }
            } else if (resolution !== null) {
                // Two axis out of bounds.
                return this.resolveTile.apply(this, resolution);
            } else {
                // Requested position within bounds.
                return position;
            }
        },
        // @param rotation as number between 0 and 5.
        // @param origin (optional) as coordinate.
        computeRotation: function(coordinate, rotation, origin) {
            var i, delta, direction = 1;
            coordinate = this.resolveTile.apply(this, coordinate);

            if (origin) {
                // To rotate around point, compute delta position.
                origin = this.resolveTile.apply(this, origin);
                delta = [
                    coordinate[0] - origin[0],
                    coordinate[1] - origin[1],
                    coordinate[2] - origin[2]
                ];
            } else {
                // Use the actual origin, no delta required.
                origin = [0, 0, 0];
                delta = [coordinate[0], coordinate[1], coordinate[2]];
            }

            if (rotation > 2) {
                rotation = rotation % 5;

                direction = -1;
                rotation -= 3;
            }

            if (direction > 0) {
                for (i = 0; i < rotation; i++) {
                    delta = [
                        -delta[1],
                        -delta[2],
                        -delta[0]
                    ];
                }
            } else {
                for (i = 0; i < rotation; i++) {
                    delta = [
                        -delta[2],
                        -delta[0],
                        -delta[1]
                    ];
                    
                }
            }

            return this.resolveTile(
                origin[0] + delta[0],
                origin[1] + delta[1],
                origin[2] + delta[2]
            );
        },
    };

    return Map;
});

