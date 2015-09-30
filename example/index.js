var NsquishyWorker = require('nsquishy-worker');

var workerOptions = {
    nsquishyOptions: {
        channel: 'talky-trace-pg-worker'
    },
    writer: true,
    match: function (msg, msgBody) {
        if (msgBody.source === 'eventlog-trace') {
            return true;
        }
        return false;
    },
    job: function (msg, msgBody, callback) {
        // Do some stuff
        // ...
        var status = 'complete';
        return callback(null, status);
    },
    finish: function (data, msg, msgBody, next) {
        var Message = require('nsquishy-message');
        if (data === 'complete') {
            var message = new Message({
                source: 'example-worker',
                payload: data
            });
            this.nsqWriter.publish('events', JSON.stringify(message));
            return next();
        }

        var message = new Message({
            source: 'example-worker',
            payload: 'there was a problem'
        });
        this.nsqWriter.publish('events', JSON.stringify(message));
        return next();

    }
};
var NsquishyWorker = require('nsquishy-worker');
var worker = new NsquishyWorker(workerOptions);
worker.start();
worker.on('error', function (err) {
    throw err;
});
