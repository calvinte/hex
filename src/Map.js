define([
    'underscore',
    'Tile',
], function(_, Tile) {
    'use strict';

    function Map(radius) {
        this.radius = radius;
        this.tiles = {}; // Stored by coordinate, formatted: `{q: {r: ...}}`.
        this.tileMetadata = {}; // Same pattern as above.
    };

    Map.prototype = {
        checkOutOfBounds: function(q, r, s) {
            return Math.abs(q) > this.radius || Math.abs(r) > this.radius || Math.abs(s) > this.radius;
        },
        computeDistance: function(a, b) {
            // @TODO confirm
            return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 2;
        },
        // @param rotation as number between 0 and 5.
        // @param origin (optional) as coordinate.
        computeRotation: function(coordinate, rotation, origin) {
            var i, delta, direction = 1;
            coordinate = this.resolveCoordinate.apply(this, coordinate);

            if (origin) {
                // To rotate around point, compute delta position.
                origin = this.resolveCoordinate.apply(this, origin);
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

            rotation = rotation % 6;
            if (rotation > 2) {
                direction = -1;
                rotation = 6 - rotation;
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

            return this.resolveCoordinate(
                origin[0] + delta[0],
                origin[1] + delta[1],
                origin[2] + delta[2]
            );
        },
        forEachCoordinate: function(fn) {
            var i, j, tile;

            for (i = -this.radius; i < this.radius + 1; i++) {
                for (j = -this.radius; j < this.radius + 1; j++) {
                    // @note on cube coordinates, third dimension is derrived.
                    // @see http://www.redblobgames.com/grids/hexagons/#coordinates
                    tile = [i, j, -i - j];
                    if (this.checkOutOfBounds.apply(this, tile)) {
                        continue;
                    }

                    tile = this.resolveCoordinate.apply(this, tile);
                    fn.apply(this, tile);
                }
            }
        },
        getTile: function(q, r, s) {
            if (this.checkOutOfBounds(q, r, s)) {
                return null;
            }

            if (!(this.tiles[q] && this.tiles[q][r])) {
                this.tiles[q] = this.tiles[q] || {};
                this.tiles[q][r] = new Tile(this, q, r, s);

            }

            return this.tiles[q][r];
        },
        getTileMetadata: function(q, r, s) {
            if (this.checkOutOfBounds(q, r, s)) {
                return null;
            }

            if (!(this.tileMetadata[q] && this.tileMetadata[q][r])) {
                this.tileMetadata[q] = this.tileMetadata[q] || {};
                this.tileMetadata[q][r] = {};
            }

            return this.tileMetadata[q][r];
        },
        /**
         * Implements cubic coordinate system. Two of three parameters are
         * required. Cubic coordinates must maintain a constant zero-sum, for
         * example [-2, 0, 2] (sum: 0) is acceptable whereas the
         * coordinate [-2, 1, 2] (sum: 1) is not.
         *
         * Coordinates that land out-of-bounds will be transposed to their
         * appropriate wraparound coordinate. Coordinates that are very
         * far out-of-bounds (more than the radius of the map) are corrected
         * using a recursive pattern that moves them the map's width closer
         * with each iteration.
         * @see http://www.redblobgames.com/grids/hexagons/#coordinates
         *
         * @param {number} [q]
         * @param {number} [r]
         * @param {number} [s]
         */
        resolveCoordinate: function(q, r, s) {
            var isSingleAxisTranslation = true, resolution = null;
            var position = [
                typeof q === 'number' ? q : (-r - s),
                typeof r === 'number' ? r : (-q - s),
                typeof s === 'number' ? s : (-q - r)
            ]

            if (this.checkOutOfBounds.apply(this, position)) {
                resolution = [null, null, null];

                if (position[0] < -this.radius && position[1] > this.radius) {
                    // [MIN, MAX, X]
                    resolution[0] = position[0] + this.radius * 2 + 1;
                    resolution[1] = position[1] + this.radius * -1 - 1;
                } else if (position[0] < -this.radius && position[2] > this.radius) {
                    // [MIN, X, MAX]
                    resolution[0] = position[0] + this.radius + 1;
                    resolution[2] = position[2] + this.radius * -2 - 1;
                } else if (position[1] < -this.radius && position[0] > this.radius) {
                    // [MAX, MIN, X]
                    resolution[0] = position[0] + this.radius * -2 - 1;
                    resolution[1] = position[1] + this.radius + 1;
                } else if (position[1] < -this.radius && position[2] > this.radius) {
                    // [X, MIN, MAX]
                    resolution[1] = position[1] + this.radius * 2 + 1;
                    resolution[2] = position[2] + this.radius * -1 - 1;
                } else if (position[2] < -this.radius && position[0] > this.radius) {
                    // [MAX, X, MIN]
                    resolution[0] = position[0] + this.radius * -1 - 1;
                    resolution[2] = position[2] + this.radius * 2 + 1;
                } else if (position[2] < -this.radius && position[1] > this.radius) {
                    // [X, MAX, MIN]
                    resolution[1] = position[1] + this.radius * -2 - 1;
                    resolution[2] = position[2] + this.radius + 1;
                } else if (position[0] > this.radius) {
                    // [MAX, X, X]
                    resolution[0] = position[0] + this.radius * -2 - 1;
                    isSingleAxisTranslation = true;
                } else if (position[0] < -this.radius) {
                    // [MIN, X, X]
                    resolution[0] = position[0] + this.radius * 2 + 1;
                    isSingleAxisTranslation = true;
                } else if (position[1] > this.radius) {
                    // [X, MAX, X]
                    resolution[1] = position[1] + this.radius * -2 - 1;
                    isSingleAxisTranslation = true;
                } else if (position[1] < -this.radius) {
                    // [X, MIN, X]
                    resolution[1] = position[1] + this.radius * 2 + 1;
                    isSingleAxisTranslation = true;
                } else if (position[2] > this.radius) {
                    // [X, X, MAX]
                    resolution[2] = position[2] + this.radius * -2 - 1;
                    isSingleAxisTranslation = true;
                } else if (position[2] < -this.radius) {
                    // [X, X, MIN]
                    resolution[2] = position[2] + this.radius * 2 + 1;
                    isSingleAxisTranslation = true;
                }
            }

            if (isSingleAxisTranslation) {
                // Only one axis was out of bounds.
                if (resolution[0] !== null && resolution[0] > 0) {
                    return this.resolveCoordinate(
                        resolution[0],
                        position[1] + this.radius * -2 + 1
                    );
                } else if (resolution[0] !== null) {
                    return this.resolveCoordinate(
                        resolution[0],
                        position[1] - this.radius * -2 - 1
                    );
                } else if (resolution[1] !== null && resolution[1] > 0) {
                    return this.resolveCoordinate(
                        null,
                        resolution[1],
                        position[2] + this.radius * -2 + 1
                    );
                } else if (resolution[1] !== null) {
                    return this.resolveCoordinate(
                        null,
                        resolution[1],
                        position[2] + this.radius + 1
                    );
                } else if (resolution[2] !== null && resolution[2] > 0) {
                    return this.resolveCoordinate(
                        null,
                        position[1] + this.radius * -1,
                        resolution[2]
                    );
                } else if (resolution[2] !== null) {
                    return this.resolveCoordinate(
                        null,
                        position[1] + this.radius,
                        resolution[2]
                    );
                }
            } else if (resolution !== null) {
                // Two axis out of bounds.
                return this.resolveCoordinate.apply(this, resolution);
            } else {
                // Requested position within bounds.
                return position;
            }
        },
    };

    return Map;
});

