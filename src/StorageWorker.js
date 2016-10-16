map = {};
onmessage = function(e) {
    var key = e.data[0];
    var value = e.data[1];

    if (value === null) {
        // Delete mode.
        delete map[key];
    } else if (value){
        // Set mode.
        map[key] = value;
    } else {
        // Get mode.
        map[key] = map[key] || '{}';
        postMessage([key, map[key]]);
    }
}

