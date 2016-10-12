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
            var position = this.completeTile(q, r, s);

            if (position[0] < -this.radius && position[1] > this.radius) {
                console.log(0);
                position = this.resolveTile(
                    position[0] + this.radius * 2 + 1,
                    position[1] + this.radius * -1 - 1
                );
            } else if (position[0] < -this.radius && position[2] > this.radius) {
                console.log(1);
                position = this.completeTile(
                    position[0] + this.radius + 1,
                    null,
                    position[2] + this.radius * -2 - 1
                );
            } else if (position[1] < -this.radius && position[0] > this.radius) {
                console.log(2);
                position = this.resolveTile(
                    position[0] + this.radius * -2 - 1,
                    position[1] + this.radius + 1
                );
            } else if (position[1] < -this.radius && position[2] > this.radius) {
                console.log(3);
                position = this.resolveTile(
                    null,
                    position[1] + this.radius * 2 + 1,
                    position[2] + this.radius * -1 - 1
                );
            } else if (position[2] < -this.radius && position[0] > this.radius) {
                console.log(4);
                position = this.resolveTile(
                    position[0] + this.radius * -1 - 1,
                    null,
                    position[2] + this.radius * 2 + 1
                );
            } else if (position[2] < -this.radius && position[1] > this.radius) {
                console.log(5);
                position = this.resolveTile(
                    null,
                    position[1] + this.radius * -2 - 1,
                    position[2] + this.radius + 1
                );
            }

            return position;
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

