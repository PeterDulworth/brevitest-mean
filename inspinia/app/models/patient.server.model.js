'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Patient Schema
 */
var PatientSchema = new Schema({
	reference: {
		type: String,
		default: '',
		required: 'Please fill Patient reference'
	},
	gender: {
		type: String
	},
	dateOfBirth: {
		type: Date
	},
	registeredOn: {
		type: Date
	},
	_provider: {
		type: Schema.ObjectId,
		ref: 'Provider'
	},
	createdOn: {
		type: Date,
		default: Date.now
	},
	_createdBy: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Patient', PatientSchema);
