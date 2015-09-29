# Nsquishy Worker

A basic NSQ worker framework using **[nsquishy](https://github.com/stongo/nsquishy)**
Based on **[nsqjs](https://github.com/dudleycarr/nsqjs)** to simplify microservice workers using NSQ
This module takes care of lots of trivial setup, and follows an established pattern we've been using at **[&yet](http://andyet.com)** to rapidly create and deploy NSQ workers anywhere.

## Configuration

* nsquishyOptions [object] - see [nsquishy](https://github.com/stongo/nsquishy) for options. Defaults to using nsqd on 127.0.0.1:4150 on topic "events" and channel "nsquishy-worker"
* writer [boolean] - whether to include an NSQ writer or not (reader included by default). Defaults to false
* match [function] - Should return `true` or `false` after analyzing the msgBody of the received NSQ message. Takes `msg`, `msgBody` as an argument. When returning `true`, the following job function is executed
* job [function] - The meat of your worker. This is where you process the NSQ message and do whatever you want. Takes `msg`, `msgBody` and `callback` as arguments. Callback expects the signature `callback(err, data)`, with `data` being any information you want to pass to the finish function
* finish [function] - The action to take after the job has finished running. Takes `data`, `msg`, `msgBody`, `next` as arguments. Here's where you would publish another message, write logs, etc. `next` signature is `next(err)`

