'use strict'

var DynamoDB = require('aws-sdk/clients/dynamodb');
var dynamodb = new DynamoDB();

exports.handler = function(event, context, callback) {
  const parsedBody = JSON.parse(event.body)
  if (parsedBody.id) {
    dynamodb.putItem(
      {Item: parsedBody, TableName: process.env.DYNAMO_TABLE},
      (err, data) => {
        if (err) {
          callback(new Error("Error posting to db"));
        } else {
          callback(null, {statusCode: 201, body: event.body});
        }
      });
  } else {
    callback(null, {statusCode: 201, body: "id field is missing"});
  }
}