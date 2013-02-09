var hex = hex || {};

hex.Map.prototype.MapTile = Class.extend({
  init: function(Map, x, y) {
    var Tile = this;

    // Set some error messages.
    var error = {
      duplicate: {message:'Found duplicate tile at ' + x + ', ' + y},
      neighbour: {message:'Cannot create tile, failed to find a neighbor.'},
      plot: {message:'Could not find plot relationship to neighbour.'}
    };
    for (var i in error) {
      error[i].key = i;
      error[i].tile = Tile;
    }

    this.Map = Map;

    this.x = x;
    this.y = y;
    this.w = x + y;
    this.neighbours = [];

    // Throw error if a duplicate tile exists.
    _.each(Map._mapTiles, function(tile) {
        if (Tile.x == tile.x && Tile.y == tile.y) throw error.duplicate;
    });

    if (!this.x && !this.y) {
        // Special case for x:0, y:0.
        this.plotX = document.width/2;
        this.plotY = document.height/2;
    } else {
        this.neighbours = _.filter(Map._mapTiles, function(tile) {
            var distance = Tile.getDistance(tile);
            if (Math.abs(distance.x) > 1 || Math.abs(distance.y) > 1) return;
            else if (Math.abs(distance.x + distance.y) > 1) return;
            else return true;
        });

        // Throw error if there are no neighbours to get plotX and plotY from.
        if (!this.neighbours.length) throw error.neighbour;

        // Determine relationship to first neighbour in order to plot new hex.
        var tile = this.neighbours[0];
        var offset = hex.utility.trigASA(30, hex.size/2, 60);
        var distance = this.getDistance(tile);
        // @TODO more generic way to determine distance for plotX and plotY.
        if (distance.x == 1 && distance.y == 0) {
            this.plotX = tile.plotX + offset[0];
            this.plotY = tile.plotY - offset[1] * 1.5;
        } else if (distance.x == 1 && distance.y == -1) {
            this.plotX = tile.plotX + offset[0] * 2;
            this.plotY = tile.plotY;
        } else if (distance.x == 0 && distance.y == -1) {
            this.plotX = tile.plotX + offset[0];
            this.plotY = tile.plotY + offset[1] * 1.5;
        } else if (distance.x == -1 && distance.y == 0) {
            this.plotX = tile.plotX - offset[0];
            this.plotY = tile.plotY + offset[1] * 1.5;
        } else if (distance.x == -1 && distance.y == 1) {
            this.plotX = tile.plotX - offset[0] * 2;
            this.plotY = tile.plotY;
        } else if (distance.x == 0 && distance.y == 1) {
            this.plotX = tile.plotX - offset[0];
            this.plotY = tile.plotY - offset[1] * 1.5;
        } else throw error.plot;
    }
    this.plot();
    Map._mapTiles.push(this);
  },
  plot: function() {
    var points = [],
        sides = 6,
        radius = hex.size;
    for (var i = 0; i < sides; i++) {
      var angle = hex.utility.degToRad(90) + (i * (1 / sides) * 2 * Math.PI);
      points.push([
        this.plotX + (radius * Math.cos(angle)),
        this.plotY + (radius * Math.sin(angle))
      ]);
    }
    var startingPoint = points[0].join(' ');
    var path = 'M' + startingPoint;
    for (var i = 1; i < sides; i++) path += 'L' + points[i].join(' ');
    path += 'L' + startingPoint;
    this.Map.element.append('path')
      .attr('d', path)
      .attr('fill', hex.colours[hex.iteration]);
    if (hex.devMode) this.Map.element.append('text')
      .attr('x', this.plotX)
      .attr('y', this.plotY)
      .text(this.getCoordString());
  },
  getCoordString: function() {
    return 'x:' + this.x + ', y:' + this.y + ', w:' + this.w;
  },
  drawNeighbours: function() {
    var limit = 2;
    var x = -limit, y = -limit;
    while (++x < limit) {
      while (++y < limit) {
        if (y == x) continue;
        try { new this.Map.prototype.MapTile(this.Map, this.x + x, this.y + y); }
        catch(e) {
          if (!e.key) throw e;
          if (e.key == 'duplicate') this.neighbours.push(e.tile);
          else throw(e.message);
        }
      }
      y = -limit;
    }
  },
  getDistance: function(tile) {
    return {x: this.x - tile.x, y: this.y - tile.y};
  }

});

