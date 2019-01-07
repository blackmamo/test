'use strict'

import * as DynamoDB from 'aws-sdk/clients/dynamodb'
var docClient = new DynamoDB.DocumentClient()

exports.handler = function(event, context, callback) {
  docClient.delete(
    {
      Key: {id: event.queryStringParameters.id},
      TableName: process.env.DYNAMO_TABLE,
      ReturnValues: "ALL_OLD"
    },
    (err, data) => {
      if (err) {
        callback(new Error("Error querying db"))
      } else {
        // TODO only the items not e.g. capacity
        callback(null, {statusCode: 200, body: JSON.stringify(data)})
      }
    });
}