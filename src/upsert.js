'use strict'

var AWS = require('aws-sdk');

exports.handler = function(event, context, callback) {
  callback(null, {statusCode:200,body:{op:"upsert", aok:true}})
}