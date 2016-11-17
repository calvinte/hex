define(['underscore'], function(_) {
    var storageWorker;
    var waitingMap = {};

    if (typeof Worker !== 'undefined') {
        storageWorker = new Worker(require.toUrl('StorageWorker.js'));
    } else {
        // No WebWorkers in node, this is a workaround for the test suite.
        var storageWorkerSpecMap = {};
        storageWorker = {
            postMessage: function(dat) {
                var key = dat[0];
                var value = dat[1];
                if (value) {
                    storageWorkerSpecMap[key] = value;
                } else if (value === null) {
                    delete storageWorkerSpecMap[key];
                } else {
                    storageWorker.onmessage({data:[key, storageWorkerSpecMap[key]]});
                }
            }
        }
    }

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
            if (waitingMap[key]) {
                waitingMap[key].push(fn);
            } else {
                waitingMap[key] = [fn];
            }

            storageWorker.postMessage([key]);
        },
        setItem: function(key, value) {
            storageWorker.postMessage([key, JSON.stringify(value)]);
        },
    };
});

