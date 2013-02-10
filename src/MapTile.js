var hex = hex || {};

hex.Map.prototype.MapTile = Class.extend({
  init: function(Map, x, y) {
    var Tile = this;

    this.Map = Map;

    // Set some error messages.
    this.error = {
      duplicate: {message:'Found duplicate tile at ' + x + ', ' + y},
      neighbour: {message:'Cannot create tile, failed to find a neighbor.'},
      plot: {message:'Could not find plot relationship to neighbour.'},
      bounds: {message:'Could not create tile, out of bounds.'}
    };
    for (var i in this.error) {
      this.error[i].key = i;
      this.error[i].tile = Tile;
    }

    this.pos = {
      x: x,
      y: y,
      w: x + y
    }
    this.neighbours = [];

    if ( Math.abs(this.pos.x) > Map.bounds
      || Math.abs(this.pos.y) > Map.bounds
      || Math.abs(this.pos.w) > Map.bounds) {
      throw this.error.bounds;
    }

    // Throw error if a duplicate tile exists.
    _.each(Map._mapTiles, function(tile) {
        if (Tile.pos.x == tile.pos.x && Tile.pos.y == tile.pos.y) {
          throw Tile.error.duplicate;
        }
    });

    if (!this.pos.x && !this.pos.y) {
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
        if (!this.neighbours.length) throw this.error.neighbour;

        // Determine relationship to first neighbour in order to plot new hex.
        this.setPlotsFromNeighbour(this.neighbours[0]);
    }

    this.plot();
    //this.detect();
    Map._mapTiles.push(this);

  },
  setPlotsFromNeighbour: function(tile) {
    var plot = hex.utility.getNeighbourHexPlot(
      {x: tile.plotX, y: tile.plotY},
      this.getDistance(tile),
      hex.tileSize
    );
    if (!plot.x || !plot.y) throw this.error.plot;
    this.plotX = plot.x;
    this.plotY = plot.y;
  },
  detect: function() {
    var self = this;
    if (this.detectInterval) clearInterval(this.detectInterval);
    this.detectInterval = setInterval(function() {
      var xMax = document.width, yMax = document.height,
          xMin = 0, yMin = 0,
          pos = self.element.node().getPointAtLength(),
          xValid, yValid;
      if (!self.Map.transform.x) self.Map.dragSetTransform();
      pos.x += self.Map.transform.x;
      pos.y += self.Map.transform.y;
      xValid = pos.x < xMax && pos.x > xMin;
      yValid = pos.y < yMax && pos.y > yMin;

      if (xValid && yValid) self.drawNeighbours();
    }, 500);
  },
  plot: function() {
    var points = [],
        sides = 6,
        radius = this.Map.tileSize;
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
    this.element = this.Map.element
      .append('path')
      .attr('d', path)
      .attr('fill', hex.colours[hex.iteration]);
    if (hex.devMode) this.Map.element.append('text')
      .attr('x', this.plotX)
      .attr('y', this.plotY)
      .text(this.getCoordString());
  },
  getCoordString: function() {
    return 'x:' + this.pos.x + ', y:' + this.pos.y + ', w:' + this.pos.w;
  },
  drawNeighbours: function() {
    var limit = 2;
    var x = -limit, y = -limit;
    while (++x < limit) {
      while (++y < limit) {
        if (y == x) continue;
        try {
          new this.Map.prototype.MapTile(
            this.Map,
            this.pos.x + x,
            this.pos.y + y
          );
        }
        catch(e) {
          if (!e.key) throw e;
          if (e.key == 'duplicate') {
            var exists = _.find(this.neighbours, function(tile) {
              return _.isEqual(tile.pos, e.tile.pos);
            });
            if (!exists) this.neighbours.push(e.tile);
          } else if (e.key == 'bounds') {
            //this.Map.tessellateTo(e.tile.pos);
          }
          else throw(e.message);
        }
      }
      y = -limit;
    }
  },
  getDistance: function(tile) {
    return {x: this.pos.x - tile.pos.x, y: this.pos.y - tile.pos.y};
  }

});

