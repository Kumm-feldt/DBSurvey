import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

const client = new S3Client({})
const fileName = "stats"
const bucketName = process.env.FRONTEND_BUCKET


const EMPTY_STATS = {
  totalResponses: 0,
  averageRating: 0,
  ratingSum: 0,
  ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  servicePopularity: {
    "EC2": 0,
    "DynamoDB": 0,
    "Lambda": 0,
    "S3": 0
  },
  lastUpdated: new Date().toISOString()
}

async function loadFile(file) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: file + ".json"
  });

  try {
    const response = await client.send(command)
    const str = await response.Body.transformToString()
    return JSON.parse(str)

  } catch (err) {
 return structuredClone(EMPTY_STATS)
  }

}

async function updateData(newData) {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${fileName}.json`,   // path inside bucket
        Body: JSON.stringify(newData),
        ContentType: "application/json"
      })
    );
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    }
  }
}
export async function handler(event) {
  // load stats
  let stats = await loadFile(fileName)

  // Only process INSERT events
  const inserts = event.Records.filter(r => r.eventName === "INSERT")
  for (const record of inserts) {
    const image = record.dynamodb.NewImage

    const rating = String(image.rating.N)
    const favoriteService = image.favoriteService.S
    // Increment totals
    stats.totalResponses += 1
    stats.ratingSum += Number(rating)

    // Update rating distribution
    stats.ratingDistribution[rating] += 1
    stats.servicePopularity[favoriteService] += 1
  }
  // Recompute derived fields
  stats.averageRating = stats.totalResponses > 0
    ? stats.ratingSum / stats.totalResponses : 0

  stats.lastUpdated = new Date().toISOString()
  await updateData(stats);
  // return 200 OK
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "batchProcessor" })
  };
};
