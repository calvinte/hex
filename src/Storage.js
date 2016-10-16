define([], function(worker) {
    var storageWorker = new Worker(require.toUrl('StorageWorker.js'));
    var waitingMap = {};

    storageWorker.onmessage = function(e) {
        var key = e.data[0];
        var value = e.data[1] && JSON.parse(e.data[1]);
        _.each(waitingMap[key], function(fn) {
            fn(value);
        });
        delete waitingMap[key];
    };

    return {
        clearItem: function(key) {
            storageWorker.postMessage([key, null]);
        },
        getItem: function(key, fn) {
            storageWorker.postMessage([key]);

            if (waitingMap[key]) {
                waitingMap[key].push(fn);
            } else {
                waitingMap[key] = [fn];
            }
        },
        setItem: function(key, value) {
            storageWorker.postMessage([key, JSON.stringify(value)]);
        },
    };
});

