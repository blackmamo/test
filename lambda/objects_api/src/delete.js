'use strict'

import * as DynamoDB from 'aws-sdk/clients/dynamodb'
var docClient = new DynamoDB.DocumentClient()

exports.handler = async function(event, context) {
  return docClient
    .delete({
      Key: {id: event.pathParameters.objectId},
      TableName: process.env.DYNAMO_TABLE,
      ReturnValues: "ALL_OLD"})
    .promise()
    .then(
      data => ({statusCode: 200, body: JSON.stringify(data.Attributes)}),
      // suppress internal errors, but log them
      err => {
        console.log("Error performing delete: " + err)
        throw new Error("Error deleting from db")
      })
}