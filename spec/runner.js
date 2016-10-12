var assert = require('assert');
var _ = require('underscore');
var Map = require('../src/Map');

describe('Hex', function() {
    var server;
    describe('Map', function() {
        it('should resolve tiles', function(done) {
            var map = new Map(5); // Map with radius of 5 (width is 11).

            // Fill in the missing axis.
            // Note that all 3 coords /must/ add up to 0.
            assert.deepEqual(map.resolveTile(5, -5), [5, -5, 0]);
            assert.deepEqual(map.resolveTile(-5, 5), [-5, 5, 0]);

            // Missing coords will be filled in based on the constraint that
            // all three coords add up to 0.
            assert.deepEqual(map.resolveTile(0, null, -5), [0, 5, -5]);
            assert.deepEqual(map.resolveTile(0, null,  5), [0, -5, 5]);

            done();
        });
        it('should rotate tiles around center', function(done) {
            var map = new Map(5); // Map with radius of 5 (width is 11).
            var tile = map.resolveTile(-3, 4, -1);

            assert.deepEqual(tile, [-3, 4, -1]);

            assert.deepEqual(map.computeRotation(tile, 1), [-4, 1, 3]);
            assert.deepEqual(map.computeRotation(tile, 2), [-1, -3, 4]);
            assert.deepEqual(map.computeRotation(tile, 3), [3, -4, 1]);
            assert.deepEqual(map.computeRotation(tile, 4), [4, -1, -3]);
            assert.deepEqual(map.computeRotation(tile, 5), [1, 3, -4]);

            done();

        });
        it('should rotate tiles around point', function(done) {
            var map = new Map(5); // Map with radius of 5 (width is 11).
            var origin = map.resolveTile(1, -1, 0);
            var tile = map.resolveTile(0, -1, 1);

            assert.deepEqual(origin, [1, -1, 0]);
            assert.deepEqual(tile, [0, -1, 1]);

            assert.deepEqual(map.computeRotation(tile, 1, origin), [1, -2, 1]);
            assert.deepEqual(map.computeRotation(tile, 2, origin), [2, -2, 0]);
            assert.deepEqual(map.computeRotation(tile, 3, origin), [2, -1, -1]);
            assert.deepEqual(map.computeRotation(tile, 4, origin), [1, 0, -1]);
            assert.deepEqual(map.computeRotation(tile, 5, origin), [0, 0, 0]);

            origin = map.resolveTile(-3, 0, 3);
            tile = map.resolveTile(-5, 0, 5);
            assert.deepEqual(origin, [-3, 0, 3]);
            assert.deepEqual(tile, [-5, 0, 5]);

            assert.deepEqual(map.computeRotation(tile, 1, origin), [-3, -2, 5]);
            assert.deepEqual(map.computeRotation(tile, 2, origin), [-1, -2, 3]);
            assert.deepEqual(map.computeRotation(tile, 3, origin), [-1, 0, 1]);
            assert.deepEqual(map.computeRotation(tile, 4, origin), [-3, 2, 1]);
            assert.deepEqual(map.computeRotation(tile, 5, origin), [-5, 2, 3]);

            done();

        });
        it('should wrap around', function(done) {
            var map = new Map(2); // Map with radius of 2 (width is 5).

            assert.deepEqual(map.resolveTile(-3, 0, 3), [0,  2, -2]);
            assert.deepEqual(map.resolveTile(-4, 1, 3), [1, -2,  1]);

            assert.deepEqual(map.resolveTile(1, -3, 3), [-2, 2, 0]);
            assert.deepEqual(map.resolveTile(2, -4, 3), [-1, 1, 0]);

            assert.deepEqual(map.resolveTile(-3, 3, 2), [2, 0, -2]);
            assert.deepEqual(map.resolveTile(-4, 3, 0), [1, 0, -1]);

            done();
        });
    });
});

