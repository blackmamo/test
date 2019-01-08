'use strict'

import * as DynamoDB from 'aws-sdk/clients/dynamodb'
var docClient = new DynamoDB.DocumentClient()

exports.handler = async function(event, context) {
  const parsedBody = JSON.parse(event.body)

  if (!parsedBody.id) {
    return Promise.resolve({statusCode: 400, body: "id field is missing"})
  }

  if (!(parsedBody.id instanceof String || (typeof parsedBody.id === "string"))) {
    return Promise.resolve({statusCode: 400, body: "id must be a string"})
  }

  return docClient
    .put({Item: parsedBody, TableName: process.env.DYNAMO_TABLE, ReturnValues: "ALL_OLD"})
    .promise()
    .then(
      data => ({
        statusCode: data.Attributes ? 200 : 201,
        headers: { "Location":  "/" + parsedBody.id },
        body: event.body
      }),
      // suppress internal errors, but log them
      err => {
        console.log("Error performing post: " + err)
        throw new Error("Error posting to db")
      }
    )
}