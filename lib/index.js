var logger = require('bucker').createLogger({ console: true });
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Joi = require('joi');
var Hoek = require('hoek');

var optionsSchema = {
    nsquishyOptions: Joi.object().optional(),
    writer: Joi.boolean().optional(),
    pre: Joi.func().required(),
    match: Joi.func().required(),
    job: Joi.func().required(),
    finish: Joi.func().optional()
};

var optionsDefaults = {
    nsquishyOptions: {
        nsqdHost: '127.0.0.1',
        nsqdPort: '4150',
        topic: 'events',
        channel: 'nsquishy-worker'
    },
    writer: false
};

function NsquishyWorker (options) {

    var self = this;
    Joi.validate(options, optionsSchema, function (err) {

        if (err) {
            throw err;
        }

        var settings = Hoek.applyToDefaults(optionsDefaults, options);

        EventEmitter.call(self);
        self.nsquishyOptions = settings.nsquishyOptions;

        var Nsquishy = require('nsquishy');
        self.nsquishy = new Nsquishy(self.nsquishyOptions);
        self.pre = settings.pre || function (msg, msgBody, callback) {
            return callback(null, msg, msgBody);
        };
        self.match = settings.match || function () {
            return true;
        };
        self.job = settings.job;
        self.finish = settings.finish;
        self.Message = require('nsquishy-message');

        self.nsquishy.squish(function (err) {

            if (err) {
                return self.emit('error', err);
            }


            self.nsquishy.nsqReader.init(function _nsqReady (err) {

                if (err) {
                    return self.emit('error', err);
                }

                self.nsqReader = self.nsquishy.nsqReader;

                if (settings.writer) {
                    self.nsquishy.nsqWriter.init(function _nsqWriterReady(err) {

                        if (err) {
                            return self.emit('error', err);
                        }

                        self.nsqWriter = self.nsquishy.nsqWriter;

                        self.emit('ready');
                    });
                }
                else {
                    self.emit('ready');
                }
            });
        });
    });
    return this;
}
util.inherits(NsquishyWorker, EventEmitter);

NsquishyWorker.prototype.start = function () {

    var self = this;
    this.on('ready', function () {

        self.nsqReader.on('message', function (msg) {

            logger.info(['nsq'], 'message received');

            var msgBody = msg.json();

            self.pre.call(self, msg, msgBody, function (err, msg, msgBody) {

                if (err) {
                    return self.emit('error', err);
                }

                if (self.match.call(self, msg, msgBody)) {

                    logger.info(['nsquishy-worker'], 'running nsquishy-worker');

                    self.nsqReader.toucher(msg);

                    self.job.call(self, msg, msgBody, function (err, data) {

                        if (err) {
                            return self.emit('error', err);
                        }

                        self.finish.call(self, data, msg, msgBody, function (err) {

                            if (err) {
                                return self.emit('error', err);
                            }

                            if (msg) {
                                logger.info(['nsq'], 'message finished');
                                self.nsquishy.nsqReader.stopTouching(msg);
                                msg.finish();
                            }
                        });
                    });
                }
                else {
                    logger.info(['nsq'], 'message ignored');
                    msg.finish();
                    logger.info(['nsq'], 'message finished');
                }
            });
        });
        logger.info(['startup'], 'nsquishy-worker loaded');
    });
};

module.exports = NsquishyWorker;
