var hex = hex || {};

hex.Map = Class.extend({
  init: function() {
    var self = this;
    var paper = d3.select('body')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    var dragSetTransform = function() {
      var t = self.element.attr('transform');
      if (t) {
        t = t.replace('translate(', '')
        t = t.replace(')', '')
        t = t.split(',');
        for (var i = 0; i < t.length; i++) t[i] = parseInt(t[i]);
      } else t = [0, 0];
      self.transform = {x: t[0], y: t[1]};
    }

    this.prototype = Object.getPrototypeOf(this);
    this.element = paper.append('g');
    this.transform = {};

    this.drag = d3.behavior.drag();
    this.drag.on('dragstart', dragSetTransform);
    this.drag.on('drag', function() {
      var translateString = 'translate(' + (self.transform.x + d3.event.dx);
      translateString += ', ' + (self.transform.y + d3.event.dy) + ')';
      self.element.attr('transform', translateString);
      dragSetTransform();
    });
    this.drag.on('dragend', dragSetTransform);
    this.element.call(this.drag);
    
    this._mapTiles = [];
    this.radius = 8;
    new this.prototype.MapTile(this, 0, 0)
    var r = this.radius;
    while (r--) {
      hex.iteration++;
      for (var i in this._mapTiles) this._mapTiles[i].drawNeighbours();
    }
  },
});

