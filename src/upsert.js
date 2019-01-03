'use strict'

var DynamoDB = require('aws-sdk/clients/dynamodb');
var docClient = new DynamoDB.DocumentClient();

exports.handler = function(event, context, callback) {
  const parsedBody = JSON.parse(event.body)
  if (!parsedBody.id) {
    callback(null, {statusCode: 400, body: "id field is missing"});
  } else if (!(parsedBody.id instanceof String || (typeof parsedBody.id === "string"))) {
    callback(null, {statusCode: 400, body: "id must be a string"});
  } else {
    docClient.put(
      {Item: parsedBody, TableName: process.env.DYNAMO_TABLE},
      (err, data) => {
        if (err) {
          callback(new Error("Error posting to db"));
        } else {
          callback(null, {statusCode: 201, body: event.body});
        }
      });
  }
}