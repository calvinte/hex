define([
    'underscore',
    'Tile',
    'baconjs',
], function(_, Tile, Bacon) {
    'use strict';

    function Map(radius) {
        this.radius = radius;
        this.tiles = {}; // Stored by coordinate, formatted: `{q: {r: ...}}`.

        this.actions = {
            tileBlurStream: new Bacon.Bus(),
            tileFocusStream: new Bacon.Bus(),
            tilePrimaryStream: new Bacon.Bus(),
            tileSecondaryStream: new Bacon.Bus(),
        };
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
        computeCoordinateAtPosition: function(x, y, scale, pointy) {
            if (pointy) {
                return this.resolveCoordinate(
                    Math.round((x * Math.sqrt(3) / 3 - y / 3) / scale * 2),
                    Math.round(y * 2 / 3 / scale * 2)
                );
            } else {
                return this.resolveCoordinate(
                    Math.round(x * 2 / 3 / scale * 2),
                    Math.round((-x / 3 + Math.sqrt(3) / 3 * y) / scale * 2)
                );
            }
        },
        /**
         * Method loops over every tile in the map. This should not be used
         * unless the entire map is presented on the screen at one time.
         * @param {function} fn
         */
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
         * Two of [q, r, s] required.
         * @param {number} [q]
         * @param {number} [r]
         * @param {number} [s]
         */
        resolveCoordinate: function(q, r, s) {
            var isSingleAxisTranslation = false, resolution = null;
            var position = [
                typeof q === 'number' ? q : (-r - s),
                typeof r === 'number' ? r : (-q - s),
                typeof s === 'number' ? s : (-q - r)
            ]

            if (this.checkOutOfBounds.apply(this, position)) {
                resolution = [null, null, null];
                if (Math.abs(position[0]) >= this.radius && Math.abs(position[1]) >= this.radius) {
                    resolution = [
                        -position[0] + (position[0] > 0 ? 1 : -1),
                        -position[1] + (position[1] > 0 ? 1 : -1),
                        -position[2] + (position[0] > 0 ? -1 : 1) + (position[1] > 0 ? -1 : 1),
                    ];
                } else if (Math.abs(position[0]) >= this.radius && Math.abs(position[2]) >= this.radius) {
                    resolution = [
                        -position[0] + (position[0] > 0 ? 1 : -1),
                        -position[1] + (position[0] > 0 ? -1 : 1) + (position[2] > 0 ? -1 : 1),
                        -position[2] + (position[2] > 0 ? 1 : -1),
                    ];
                } else if (Math.abs(position[1]) >= this.radius && Math.abs(position[2]) >= this.radius) {
                    resolution = [
                        -position[0] + (position[1] > 0 ? -1 : 1) + (position[2] > 0 ? -1 : 1),
                        -position[1] + (position[1] > 0 ? 1 : -1),
                        -position[2] + (position[2] > 0 ? 1 : -1),
                    ];
                } else if (Math.abs(position[0]) > this.radius) {
                    resolution = [
                        -position[0] + (position[0] > 0 ? 1 : -1),
                        -position[1] + (position[0] > 0 ? -1 : 1),
                        -position[2],
                    ];
                } else if (Math.abs(position[1]) > this.radius) {
                    resolution = [
                        -position[0] + (position[1] > 0 ? -1 : 1),
                        -position[1] + (position[1] > 0 ? 1 : -1),
                        -position[2],
                    ];
                } else if (Math.abs(position[2]) > this.radius) {
                    resolution = [
                        -position[0],
                        -position[1] + (position[2] > 0 ? -1 : 1),
                        -position[2] + (position[2] > 0 ? 1 : -1),
                    ];
                }
            }

            if (resolution !== null) {
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

