var hex = hex || {};

hex.Map = Class.extend({
  init: function() {
    var self = this;
    this.paper = d3.select('body')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    this.prototype = Object.getPrototypeOf(this);
    this.element = this.paper.append('g').attr('id', 'hex-map')
    this.transform = {};

    this.tileSize = hex.tileSize;
    this.bounds = hex.mapSize;

    this.dragSetTransform = function() {
      var t = self.element.attr('transform');
      if (t) {
        t = t.replace('translate(', '')
        t = t.replace(')', '')
        t = t.split(',');
        for (var i = 0; i < t.length; i++) t[i] = parseInt(t[i]);
      } else t = [0, 0];
      self.transform = {x: t[0], y: t[1]};
    }

    this.drag = d3.behavior.drag();
    this.drag.on('dragstart', this.dragSetTransform);
    this.drag.on('drag', function() {
      var translateString = 'translate(' + (self.transform.x + d3.event.dx);
      translateString += ', ' + (self.transform.y + d3.event.dy) + ')';
      self.element.attr('transform', translateString);
      self.dragSetTransform();
    });
    this.drag.on('dragend', this.dragSetTransform);
    this.element.call(this.drag);
    
    this._mapTiles = [];
    this._tessellations = {};
    this.radius = hex.mapSize;
    new this.prototype.MapTile(this, 0, 0)
    var r = this.radius;
    while (r--) {
      hex.iteration++;
      for (var i in this._mapTiles) this._mapTiles[i].drawNeighbours();
    }
  },
  tessellateTo: function(pos) {
    var self = this;
    var tess = this.paper
      .append('use')
      .attr('xlink:href', '#hex-map');
    for (var i in pos) {
      pos[i] = Math.floor(Math.abs(pos[i]/this.bounds)) * (pos[i] < 1 ? -1 : 1);
    }
    width = hex.utility.trigASA(30, this.tileSize/2, 90);
    var plot = hex.utility.getNeighbourHexPlot(
      {x: 0, y: 0},
      pos,
      this.tileSize * this.bounds * 2,
      true
    );
    if (pos.x == 1 && pos.y == 0) {
      tess.attr('x', plot.x - width[1]).attr('y', plot.y + width[0]*1.5);
    } else if (pos.x == 1 && pos.y == -1) {
      tess.attr('x', plot.x - width[1]*2).attr('y', plot.y);
    } else if (pos.x == 0 && pos.y == -1) {
      tess.attr('x', plot.x - width[1]).attr('y', plot.y - width[0]*1.5);
    } else if (pos.x == -1 && pos.y == 0) {
      tess.attr('x', plot.x + width[1]).attr('y', plot.y - width[0]*1.5);
    } else if (pos.x == -1 && pos.y == 1) {
      tess.attr('x', plot.x + width[1]*2).attr('y', plot.y);
    } else if (pos.x == 0 && pos.y == 1) {
      tess.attr('x', plot.x + width[1]).attr('y', plot.y + width[0]*1.5);
    }
  }
});

