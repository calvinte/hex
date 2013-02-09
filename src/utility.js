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
  }
};

