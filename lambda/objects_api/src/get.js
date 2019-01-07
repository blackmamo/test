'use strict'

import * as DynamoDB from 'aws-sdk/clients/dynamodb'
var docClient = new DynamoDB.DocumentClient()

exports.handler = function(event, context, callback) {
  docClient.get(
    {Key: {id: event.queryStringParameters.id}, TableName: process.env.DYNAMO_TABLE},
    (err, data) => {
      if (err) {
        callback(new Error("Error querying db"))
      } else {
      console.log()
        callback(null, {statusCode: 200, body: JSON.stringify(data.Item)})
      }
    });
}