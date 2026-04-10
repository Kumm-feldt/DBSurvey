import {
  DynamoDBClient,
  PutItemCommand, 
} from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient()
const TABLENAME = process.env.TABLE_NAME

export async function handler(event) {

  const body = JSON.parse(event.body)

  let responseId = crypto.randomUUID()
  let name = body.name
  let email = body.email
  let rating = body.rating
  let favoriteService = body.favoriteService
  let comment = body.comment || ""
  let submittedAt = new Date().toISOString()

  let command = new PutItemCommand({
    TableName: TABLENAME,
    Item: {
      responseId: { S: responseId },
      name: { S: name },
      email: { S: email },
      rating: { N: String(rating) },
      favoriteService: { S: favoriteService },
      comment: { S: comment },
      submittedAt: { S: submittedAt }
    },
  })

  try {
    await client.send(command)
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Response recorded" }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    }
  }

};

