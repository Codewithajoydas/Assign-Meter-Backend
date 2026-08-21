const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("./utils/s3");
const dotenv  = require("dotenv")
dotenv.config();
async function testS3() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: "test/hello.txt",
      Body: "Hello from Node.js!",
      ContentType: "text/plain",
    });

    await s3.send(command);

    console.log("File uploaded successfully!");
  } catch (error) {
    console.error("S3 upload failed");
    console.error(error);
  }
}

testS3();