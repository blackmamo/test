'use strict'

var DynamoDB = require('aws-sdk/clients/dynamodb');
var docClient = new DynamoDB.DocumentClient();

exports.handler = function(event, context, callback) {
  docClient.delete(
    {Key: {id: event.queryStringParameters.id}, TableName: process.env.DYNAMO_TABLE, ReturnValues: true},
    (err, data) => {
      if (err) {
        callback(new Error("Error querying db"));
      } else {
        // TODO only the items not e.g. capacity
        callback(null, {statusCode: 200, body: JSON.stringify(data)});
      }
    });
}