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
        this.nsqWriter.publish('events', JSON.stringify('cowabunga'));
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
