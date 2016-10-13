define([], function() {
    function Tile(map, q, r, s) {
        this.map = map;
        this.coordinate = this.map.resolveCoordinate(q, r, s);
    };

    Tile.prototype = {
        /**
        * @param {number} [scale=1]
        */
        center: function(scale) {
            if (!scale) {
                scale = 1;
            }

            if (this.pointy) {
                return [
                    scale/2 * (Math.sqrt(3) * this.coordinate[0] + Math.sqrt(3) / 2 * this.coordinate[1]),
                    scale/2 * (1.5 * this.coordinate[1])
                ];
            } else {
                return [
                    scale/2 * (1.5 * this.coordinate[0]),
                    scale/2 * (Math.sqrt(3) / 2 * this.coordinate[0] + Math.sqrt(3) * this.coordinate[1])
                ];
            }
        },
        pointy: true,
        /**
        * Returns two-dimensional array of verticies.
        * @param {number} scale
        */
        vertices: function(scale) {
            var i = -1, angle, vertices = [];
            var center = this.center(scale);

            while (++i < 6) {
                angle = 2 * Math.PI * (2 * i - (this.pointy ? 1 : 0)) / 12;
                vertices.push([
                    center[0] + 0.5 * scale * Math.cos(angle),
                    center[1] + 0.5 * scale * Math.sin(angle)
                ]);
            }

            return vertices;
        },

    };

    return Tile;
});

