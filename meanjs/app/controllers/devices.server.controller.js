'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Device = mongoose.model('Device'),
  sparkcore = require('spark'),
  Q = require('q'),
  _ = require('lodash');

function errorCallback(err) {
  return err;
}

exports.initialize = function(req, res) {
  var device, sparkID, step;

  console.log('device.initialize');
  Q.fcall(function(id) {
      step = 'Device.findById';
      return new Q(Device.findById(id).populate('_spark', 'sparkID').exec());
    }, req.body.device._id)
    .then(function(d) {
      step = 'Spark login';
      device = d;
      sparkID = device._spark.sparkID;
      return new Q(sparkcore.login({ username: 'leo3@linbeck.com', password: '2january88' }));
    })
    .then(function() {
      console.log('listDevices', sparkID);
      step = 'Spark listDevices';
      return new Q(sparkcore.listDevices());
    })
    .then(function(sparkDevices) {
      var sparkDevice = _.findWhere(sparkDevices, {id: sparkID});
      console.log('callFunction', sparkDevices, sparkDevice);
      step = 'Spark callFunction';
      if (!sparkDevice.attributes.connected) {
        throw new Error(device.name + ' is not online.');
      }
      return new Q(sparkDevice.callFunction('runcommand', 'initialize_device'));
    })
    .then(function(result) {
      step = 'Return response';
      res.jsonp({
        result: result
      });
    })
    .fail(function(error) {
      console.error(error);
      return res.status(400).send({
        message: error.message,
        step: step
      });
    })
    .done();
};

/**
 * Create a Device
 */
exports.create = function(req, res) {
  var device = new Device(req.body);
  device.user = req.user;

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Show the current Device
 */
exports.read = function(req, res) {
  var device = req.device;

  device.populate([{
    path: '_deviceModel',
    select: '_id name'
  }, {
    path: '_spark',
    select: '_id name sparkID'
  }], function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Update a Device
 */
exports.update = function(req, res) {
  var device = req.device;

  device = _.extend(device, req.body);

  device.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * Delete an Device
 */
exports.delete = function(req, res) {
  var device = req.device;

  device.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(device);
    }
  });
};

/**
 * List of Devices
 */
exports.list = function(req, res) {
  Device.find().sort('-created').populate('user', 'displayName').exec(function(err, devices) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(devices);
    }
  });
};

/**
 * Device middleware
 */
exports.deviceByID = function(req, res, next, id) {
  Device.findById(id).populate([{
    path: 'user',
    select: 'displayName'
  }, {
    path: '_spark',
    select: '_id name'
  }, {
    path: '_deviceModel',
    select: '_id name'
  }]).exec(function(err, device) {
    if (err) return next(err);
    if (!device) return next(new Error('Failed to load Device ' + id));
    req.device = device;
    next();
  });
};

/**
 * Device authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
  if (req.device.user.id !== req.user.id) {
    return res.status(403).send('User is not authorized');
  }
  next();
};
