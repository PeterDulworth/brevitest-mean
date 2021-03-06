'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Cartridge Schema
 */
var CartridgeSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Cartridge name',
		trim: true
	},
	value: {
		type: Number
	},
	rawData: {
		type: String
	},
	bcodeString: {
		type: String
	},
	failed: {
		type: Boolean
	},
	manufacturedOn: {
		type: Date,
		default: Date.now
	},
	expirationDate: {
		type: Date
	},
	orderedOn: {
		type: Date
	},
	registeredOn: {
		type: Date
	},
	startedOn: {
		type: Date
	},
	finishedOn: {
		type: Date
	},
	_test: {
		type: Schema.ObjectId,
		ref: 'Test'
	},
	_assay: {
		type: Schema.ObjectId,
		ref: 'Assay'
	},
	_device: {
		type: Schema.ObjectId,
		ref: 'Device'
	},
	_registeredBy: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	_runBy: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Cartridge', CartridgeSchema);
