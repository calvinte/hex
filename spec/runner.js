var assert = require('assert');
var _ = require('underscore');

if (typeof define !== 'function') {
    global.define = require('requirejs');
    global.define.config({
        paths: {
            baconjs: __dirname + '../node_modules/baconjs/dist/Bacon',
            Map: __dirname + '/../src/Map',
            Tile: __dirname + '/../src/Tile',
            Storage: __dirname + '/../src/Storage',
            StorageWorker: __dirname + '/../src/StorageWorker',
        }
    });
}

describe('Hex', function() {
    var server;
    describe('Map', function() {
        it('should resolve tiles', function(done) {
            define(['Map'], function(Map) {
                var map = new Map(5); // Map with radius of 5 (width is 11).

                // Fill in the missing axis.
                // Note that all 3 coords /must/ add up to 0.
                assert.deepEqual(map.resolveCoordinate(5, -5), [5, -5, 0]);
                assert.deepEqual(map.resolveCoordinate(-5, 5), [-5, 5, 0]);

                // Missing coords will be filled in based on the constraint that
                // all three coords add up to 0.
                assert.deepEqual(map.resolveCoordinate(0, null, -5), [0, 5, -5]);
                assert.deepEqual(map.resolveCoordinate(0, null,  5), [0, -5, 5]);

                done();
            });
        });
        it('should rotate tiles around center', function(done) {
            define(['Map'], function(Map) {
                var map = new Map(5); // Map with radius of 5 (width is 11).
                var tile = map.resolveCoordinate(-3, 4, -1);

                assert.deepEqual(tile, [-3, 4, -1]);

                assert.deepEqual(map.computeRotation(tile, 1), [-4, 1, 3]);
                assert.deepEqual(map.computeRotation(tile, 2), [-1, -3, 4]);
                assert.deepEqual(map.computeRotation(tile, 3), [3, -4, 1]);
                assert.deepEqual(map.computeRotation(tile, 4), [4, -1, -3]);
                assert.deepEqual(map.computeRotation(tile, 5), [1, 3, -4]);

                done();

            });
        });
        it('should rotate tiles around point', function(done) {
            define(['Map'], function(Map) {
                var map = new Map(5); // Map with radius of 5 (width is 11).
                var origin = map.resolveCoordinate(1, -1, 0);
                var tile = map.resolveCoordinate(0, -1, 1);

                assert.deepEqual(origin, [1, -1, 0]);
                assert.deepEqual(tile, [0, -1, 1]);

                assert.deepEqual(map.computeRotation(tile, 1, origin), [1, -2, 1]);
                assert.deepEqual(map.computeRotation(tile, 2, origin), [2, -2, 0]);
                assert.deepEqual(map.computeRotation(tile, 3, origin), [2, -1, -1]);
                assert.deepEqual(map.computeRotation(tile, 4, origin), [1, 0, -1]);
                assert.deepEqual(map.computeRotation(tile, 5, origin), [0, 0, 0]);

                origin = map.resolveCoordinate(-3, 0, 3);
                tile = map.resolveCoordinate(-5, 0, 5);
                assert.deepEqual(origin, [-3, 0, 3]);
                assert.deepEqual(tile, [-5, 0, 5]);

                assert.deepEqual(map.computeRotation(tile, 1, origin), [-3, -2, 5]);
                assert.deepEqual(map.computeRotation(tile, 2, origin), [-1, -2, 3]);
                assert.deepEqual(map.computeRotation(tile, 3, origin), [-1, 0, 1]);
                assert.deepEqual(map.computeRotation(tile, 4, origin), [-3, 2, 1]);
                assert.deepEqual(map.computeRotation(tile, 5, origin), [-5, 2, 3]);

                done();
            });
        });
        it('should wrap around', function(done) {
            define(['Map'], function(Map) {
                var map = new Map(2); // Map with radius of 2 (width is 5).

                // Let's test some edge cases (get it, edge haha)
                // These points are on the outer perimeter of the map bounds.
                // As they are out-of-bounds, they get resolved to the proper
                // coordinate to mimic "wraparound".
                // @see http://www.redblobgames.com/grids/hexagons/#wraparound
                assert.deepEqual(map.resolveCoordinate(0, 3), [2, -2, 0]); // Corner
                assert.deepEqual(map.resolveCoordinate(-1, 3), [1, -2, 1]);
                assert.deepEqual(map.resolveCoordinate(-2, 3), [0, -2, 2]);
                assert.deepEqual(map.resolveCoordinate(-3, 3), [2, 0, -2]); // Corner
                assert.deepEqual(map.resolveCoordinate(-3, 2), [2, -1, -1]);
                assert.deepEqual(map.resolveCoordinate(-3, 1), [2, -2, 0]);
                assert.deepEqual(map.resolveCoordinate(-3, 0), [0, 2, -2]); // Corner
                assert.deepEqual(map.resolveCoordinate(-2, -1), [1, 1, -2]);
                assert.deepEqual(map.resolveCoordinate(-1, -2), [2, 0, -2]);
                assert.deepEqual(map.resolveCoordinate(0, -3), [-2, 2, 0]); // Corner
                assert.deepEqual(map.resolveCoordinate(1, -3), [-1, 2, -1]);
                assert.deepEqual(map.resolveCoordinate(2, -3), [0, 2, -2]);
                assert.deepEqual(map.resolveCoordinate(3, -3), [-2, 0,  2]); // Corner
                assert.deepEqual(map.resolveCoordinate(3, -2), [-2, 1, 1]);
                assert.deepEqual(map.resolveCoordinate(3, -1), [-2, 2, 0]);
                assert.deepEqual(map.resolveCoordinate(3, 0), [0, -2,  2]); // Corner
                assert.deepEqual(map.resolveCoordinate(2, 1), [-1, -1, 2]);
                assert.deepEqual(map.resolveCoordinate(1, 2), [-2, 0, 2]);

                // Some tiles further outside the perimiter.
                assert.deepEqual(map.resolveCoordinate(0, 4), [2, -1, -1]);
                assert.deepEqual(map.resolveCoordinate(-2, 4), [0, -1, 1]);
                assert.deepEqual(map.resolveCoordinate(-4, 3), [ 1, 0, -1]);
                assert.deepEqual(map.resolveCoordinate(1, -4), [-1, 1, 0]);
                assert.deepEqual(map.resolveCoordinate(4, -1), [-1, 2, -1]);
                assert.deepEqual(map.resolveCoordinate(2, 2), [-1, 0, 1]);

                // Even further...
                assert.deepEqual(map.resolveCoordinate(0, 5), [ 2, 0, -2]);
                assert.deepEqual(map.resolveCoordinate(0, 6), [-1, -1, 2]);
                assert.deepEqual(map.resolveCoordinate(0, 9), [-1, 2, -1]);
                assert.deepEqual(map.resolveCoordinate(0, 13), [ 1, 1, -2]);

                // All axis out-of-bounds.
                assert.deepEqual(map.resolveCoordinate(4, 9), [0, 0, 0]);
                assert.deepEqual(map.resolveCoordinate(4, 5), [-2, 1, 1]);

                done();
            });
        });
    });
    describe('Tile', function() {
        it('should compute center', function(done) {
            define(['Map', 'Tile'], function(Map, Tile) {
                var map = new Map(2); // Map with radius of 2 (width is 5).

                // A couple nice round-number examples (uncommon).
                assert.deepEqual(new Tile(map, -1, 2).center(2), [0, 3]);
                assert.deepEqual(new Tile(map, 1, -2).center(2), [0, -3]);
                done();
            });
        });
        it('should compute vertices', function(done) {
            define(['Map', 'Tile'], function(Map, Tile) {
                var map = new Map(2); // Map with radius of 2 (width is 5).
                var tile = new Tile(map, -1, 2);
                var expectedTileVerticies = [[
                        Math.sqrt(3)/2,
                        2.5
                    ], [
                        Math.sqrt(3)/2,
                        3.5
                    ], [
                        Math.cos(90 * Math.PI/180),
                        4
                    ], [
                        -Math.sqrt(3)/2,
                        3.5
                    ], [
                        -Math.sqrt(3)/2,
                        2.5
                    ], [
                        Math.cos(270 * Math.PI/180),
                        2
                    ]
                ];

                _.each(tile.vertices(2), function(vertex, i) {
                    _.each(vertex, function(mag, j) {
                        if (Math.abs(mag) < 1) {
                            // Small number evaluation...
                            assert(vertex[0] - expectedTileVerticies[i][0] < 1e-15);
                        } else {
                            assert.equal(mag.toPrecision(1), expectedTileVerticies[i][j].toPrecision(1));
                        }
                    });
                });

                done();
            });
        });
        it('should compose events into streams', function(done) {
            define(['Map', 'Tile'], function(Map, Tile) {
                var map = new Map(2); // Map with radius of 2 (width is 5).
                var tile = new Tile(map, -1, 2);
                var onValueCallbackCount = 0;

                tile.actions.blurStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseout');
                });
                tile.actions.focusStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseover');
                });
                tile.actions.primaryStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseup');
                });
                tile.actions.secondaryStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'contextmenu');
                });

                tile.actions.mouseoutStream.push({type: 'mouseout'})
                tile.actions.mouseoverStream.push({type: 'mouseover'})
                tile.actions.mouseupStream.push({type: 'mouseup'})
                tile.actions.contextmenuStream.push({type: 'contextmenu'})

                assert.equal(onValueCallbackCount, 4);
                done();
            });
        });
        it('should pass events to the map', function(done) {
            define(['Map', 'Tile'], function(Map, Tile) {
                var map = new Map(2); // Map with radius of 2 (width is 5).
                var tile = new Tile(map, -1, 2);
                var onValueCallbackCount = 0;

                map.actions.tileBlurStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseout');
                });
                map.actions.tileFocusStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseover');
                });
                map.actions.tilePrimaryStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'mouseup');
                });
                map.actions.tileSecondaryStream.onValue(function(event) {
                    onValueCallbackCount++;
                    assert.equal(event.type, 'contextmenu');
                });

                // Plugs tile events into the map.
                tile.actions.drawStream.push(true);

                tile.actions.mouseoutStream.push({type: 'mouseout'})
                tile.actions.mouseoverStream.push({type: 'mouseover'})
                tile.actions.mouseupStream.push({type: 'mouseup'})
                tile.actions.contextmenuStream.push({type: 'contextmenu'})

                assert.equal(onValueCallbackCount, 4);
                done();
            });
        });
    });
    describe('Storage', function() {
        var key = 'spec_' + Date.now();
        var value = Math.random().toString().slice(2);
        it('should set item', function(done) {
            define(['Storage'], function(Storage) {
                Storage.setItem(key, value);
                setTimeout(done, 4);
            });
        });
        it('should get item', function(done) {
            define(['Storage'], function(Storage) {
                Storage.getItem(key, function(_value) {
                    assert.equal(_value, value);
                    done();
                });
            });
        });
        it('should clear item', function(done) {
            define(['Storage'], function(Storage) {
                Storage.clearItem(key);
                setTimeout(function() {
                    Storage.getItem(key, function(_value) {
                        assert.equal(_value, null);
                        done();
                    });
                }, 4);
            });
        });
    });
});

