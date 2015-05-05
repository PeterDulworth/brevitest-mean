'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Spark = mongoose.model('Spark'),
	_ = require('lodash'),
	sparkcore = require('spark'),
	Q = require('q');

var callspark = new Q(sparkcore.login({username: 'leo3@linbeck.com', password: '2january88'}));
console.log('Spark test');

/**
 * Refresh Spark data
 */

function getUpdatePromise(e) {
	return new Q(Spark.findOneAndUpdate({sparkID: e.sparkID}, e, {new: true, upsert: true})
								.exec(function(err, result) {
											if (err) {
												console.log('Error in getUpdatePromise)', err);
											}
										}
									)
							);
}

function updateSparks(res, sparkInfo) {
	var promises = [];

	sparkInfo.forEach(function(e) {
		promises.push(getUpdatePromise(e));
	});

	Q.allSettled(promises)
		.then(function() {
				Spark.find(function(err, result) {
					if (err) {
						throw new Error(err);
					}
					else {
						console.log(res);
						res.jsonp(result);
					}
				});
			})
		.done();
}

exports.refresh = function(req, res) {
	console.log('Spark start refresh');
	callspark.then(
		function(token) {
			return new Q(sparkcore.listDevices());
		})
	.then(
		function (devices) {
			var sparkInfo = [];
			devices.forEach(function(e) {
				sparkInfo.push({
					name: e.attributes.name,
					sparkID: e.attributes.id,
					lastHeard: e.attributes.lastHeard,
					lastIpAddress: e.attributes.lastIpAddress,
					connected: e.attributes.connected
				});
			});
			updateSparks(res, sparkInfo);
		})
	.catch(
		function (err) {
			console.log('Spark refresh failed', err);
		})
	.done();
};

/**
 * Create a Spark
 */
exports.create = function(req, res) {
	var spark = new Spark(req.body);
	spark.user = req.user;

	spark.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * Show the current Spark
 */
exports.read = function(req, res) {
	res.jsonp(req.spark);
};

/**
 * Update a Spark
 */
exports.update = function(req, res) {
	var spark = req.spark ;

	spark = _.extend(spark , req.body);

	spark.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * Delete an Spark
 */
exports.delete = function(req, res) {
	var spark = req.spark ;

	spark.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spark);
		}
	});
};

/**
 * List of Sparks
 */
exports.list = function(req, res) {
	console.log('Spark list');
	Spark.find().sort('-created').populate('user', 'displayName').exec(function(err, sparks) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(sparks);
		}
	});
};

/**
 * Spark middleware
 */
exports.sparkByID = function(req, res, next, id) {
	Spark.findById(id).populate('user', 'displayName').exec(function(err, spark) {
		if (err) return next(err);
		if (! spark) return next(new Error('Failed to load Spark ' + id));
		req.spark = spark ;
		next();
	});
};

/**
 * Spark authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.spark.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
