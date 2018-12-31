'use strict'

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context, callback) {
  dynamodb.getItem(
    {Key: {Id: event.queryStringParameters.id}, TableName: process.env.DYNAMO_TABLE},
    (err, data) => {
      if (err) {
        callback(new Error("Error querying db"));
      } else {
        callback(null, {statusCode: 200, body: JSON.stringify(data)});
      }
    });
}