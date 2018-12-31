'use strict'

var AWS = require('aws-sdk/clients/dynamodb');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context, callback) {
  dynamodb.getItem(
    {Key: {Id: event.queryStringParameters.id}, TableName: process.env.DYNAMO_TABLE, ReturnValues: true},
    (err, data) => {
      if (err) {
        callback(new Error("Error querying db"));
      } else {
        // TODO only the items not e.g. capacity
        callback(null, {statusCode: 200, body: JSON.stringify(data)});
      }
    });
}