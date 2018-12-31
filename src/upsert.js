'use strict'

var AWS = require('aws-sdk/clients/dynamodb');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context, callback) {
  dynamodb.putItem(
    {Item: JSON.parse(event.body), TableName: process.env.DYNAMO_TABLE},
    (err, data) => {
      if (err) {
        callback(new Error("Error posting to db"));
      } else {
        callback(null, {statusCode: 201, body: event.body});
      }
    });
}