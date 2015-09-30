var NsquishyWorker = require('nsquishy-worker');

var workerOptions = {
    nsquishyOptions: {
        channel: 'example-worker'
    },
    writer: true,
    match: function (msg, msgBody) {
        if (msgBody.source === 'eventlog-trace') {
            return true;
        }
        return false;
    },
    job: function (msg, msgBody, callback) {
        var Message = require('nsquishy-message');
        var message = new Message({
            source: 'example-worker',
            payload: 'cowabunga'
        });
        this.nsqWriter.publish('events', JSON.stringify(message));
        return callback(null, 'complete');
    },
    finish: function (data, msg, msgBody, next) {
        console.log('job status: %s', data);
        return next();
    }
};
var NsquishyWorker = require('nsquishy-worker');
var worker = new NsquishyWorker(workerOptions);
worker.start();
worker.on('error', function (err) {
    throw err;
});
