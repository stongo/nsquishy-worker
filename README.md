# Nsquishy Worker

An opinionated NSQ worker framework using **[nsquishy](https://github.com/stongo/nsquishy)**.
Based on **[nsqjs](https://github.com/dudleycarr/nsqjs)** to simplify workers using NSQ.
This module takes care of lots of trivial setup such as logging and discovery, and follows an established pattern we've been using at **[&yet](http://andyet.com)** to rapidly create and deploy NSQ workers anywhere.

## Configuration

* nsquishyOptions [object] - See [nsquishy](https://github.com/stongo/nsquishy) for options. Defaults to using nsqd on 127.0.0.1:4150 on topic "events" and channel "nsquishy-worker"
* writer [boolean] - Whether to include an NSQ writer or not (reader included by default). Defaults to false
* pre [function] - A function to modify the `msg` and `msgBody` before passing it through the chain. Takes `msg`, `msgBody` and `callback` as arguments. Callback expects the signature `callback(err, msg, msgBody)`
* match [function] - Should return `true` or `false` after analyzing `msg` and `msgBody` of the received NSQ message. Takes `msg`, `msgBody` as an argument. When returning `true`, the following job function is executed
* job [function] - The meat of your worker. This is where you process the NSQ message and do whatever you want. Takes `msg`, `msgBody` and `callback` as arguments. Callback expects the signature `callback(err, data)`, with `data` being any information you want to pass to the finish function
* finish [function] - The action to take after the job has finished running. Takes `data`, `msg`, `msgBody`, `next` as arguments. Here's where you would publish another message, write logs, etc. `next` signature is `next(err)`

## Context

All the functions listed on the configuration above have access to the following methods and properties in `this`

* nsqReader - a pre-configured [nsqjs](https://github.com/dudleycarr/nsqjs) reader
* nsqWriter - a pre-configured [nsqjs](https://github.com/dudleycarr/nsqjs) writer (if writer set to true in configuration)
* nsquishyOptions - settings used in configuration
* nsquishy - the instantiated nsquishy object
* Message - [nsquishy-message](https://github.com/stongo/nsquishy-message) constructor for creating new messages

## Opinions

* *Unique Channels* - Distinct workers that listen to the same topic should all have unique channels. For instance, if you have two worker types, "alert-worker" and "log-worker", interested in topic "metrics", set all pooled alert-workers to channel "alert-worker" and all log-workers to channel "log-worker."
* *Finish all messages* - since all channels get their own stream of a given topic, if a worker isn't interested in a message, it should finish it. This won't disturb other channels and keeps the nsqd queues under control. Nsquishy Worker handles this for you, so you don't need to do anything in the `finish` function
* *Standardized message bodies* - it is highly recommended to publish messages using **[nsquishy-message](https://github.com/stongo/nsquishy-message)** to avoid complexity as worker types scale. The message constructor comes bundled already with nsquishy-worker
* *Horizontal Scaling* - The core Nsquishy module used in this module allows worker to connect to nsqd or nsqlookupd by manually specifying their addresses, or by reading etcd keys where the host information is stored. This allows for easy clustering on hosts such as CoreOS
* *Plugable* - check soon for other modules that can be used for the `match`, `job` and `finish` functions

## Example

See `example/index.js`