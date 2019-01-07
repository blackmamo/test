'use strict'

import * as DynamoDB from 'aws-sdk/clients/dynamodb'
var docClient = new DynamoDB.DocumentClient()

exports.handler = async function(event, context) {
  return docClient
    .get({Key: {id: event.pathParameters.objectId}, TableName: process.env.DYNAMO_TABLE})
    .promise()
    .then(
      data => {
        console.log(JSON.stringify(data))
        return {statusCode: data.Item ? 200 : 404, body: JSON.stringify(data.Item)}
      },
      err => {throw new Error("Error querying db")}
    )
}