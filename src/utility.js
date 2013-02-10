var hex = hex || {};
hex.utility = {
  degToRad: function(x) {
    return x / 180 * Math.PI;
  },
  trigASA: function(A, a, B) {
    var C = 180 - (A + B);
    var sinA = Math.sin(hex.utility.degToRad(A));
    var sinB = Math.sin(hex.utility.degToRad(B));
    var sinC = Math.sin(hex.utility.degToRad(C));
    var ratio = a/sinA
    b = ratio * sinB;
    c = ratio * sinC;
    return [b, c];
  },
  getNeighbourHexPlot: function(start, distance, size, invert) {
    var points = [], sides = 6, angle, plot, i,
        offset = hex.utility.trigASA(30, size/2, 60),
        radius = invert ? offset[1] * 1.5 : offset[0] * 2,
        solution = [
          {x: 1, y: 0},
          {x: 1, y: -1},
          {x: 0, y: -1},
          {x: -1, y: 0},
          {x: -1, y: 1},
          {x: 0, y: 1}
        ];
    for (i = 0; i < sides; i++) {
      angle = i * (1 / sides) * 2 * Math.PI;
      if (invert) angle += hex.utility.degToRad(90);
      points.push({
        x: start.x + (radius * Math.cos(angle)),
        y: start.y + (radius * Math.sin(angle))
      });
    }
    _.each(solution, function(value, index) {
      if (JSON.stringify(value) == JSON.stringify(distance)) {
        plot = points[index];
      }
    });
    return plot;
  }
};

