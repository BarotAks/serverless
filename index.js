const { PubSub } = require('@google-cloud/pubsub');
const functions = require('@google-cloud/functions-framework');
const mailgun = require('mailgun-js');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pubSubClient = new PubSub();
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

functions.cloudEvent('helloPubSub', async (cloudEvent) => {
  try {
    const pubsubMessage = cloudEvent.data.message;
    const dataBuffer = Buffer.from(pubsubMessage.data, 'base64');
    const messageData = dataBuffer.toString('utf8');
    console.log('Received message:', messageData);
    const message = JSON.parse(messageData);
    const { username, firstName, lastName, verificationToken } = message;

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 2); // Set expiration time to 2 minutes from now

    const verificationLink = `https://${process.env.LINK}/user/verify?token=${verificationToken}`;

    const mailOptions = {
      from: 'no-reply@f23cloud.me',
      to: username,
      subject: 'Verify Your Email',
      text: `Hello ${firstName} ${lastName},\n\nClick the following link to verify your email: ${verificationLink}`,
    };

    try {
      const [results] = await mg.messages().send(mailOptions);
      console.log(`Email sent to ${username}: ${results.message}`);

      // Update user's verificationEmailSentAt column
      const connection = await pool.getConnection();
      try {
        const [updateEmailSentResult] = await connection.execute('UPDATE users SET verificationEmailSentAt = ? WHERE username = ?', [new Date(), username]);
        console.log('User verification email sent timestamp updated:', updateEmailSentResult);

        // Update user's verified status and linkVerifiedAt column upon verification
        const [updateVerificationResult] = await connection.execute('UPDATE users SET verified = true, linkVerifiedAt = ? WHERE username = ? AND verificationToken = ?', [new Date(), username, verificationToken]);
        console.log('User verification status and link verification timestamp updated:', updateVerificationResult);
      } catch (updateError) {
        console.error('Error updating user verification status or email sent timestamp:', updateError);
      } finally {
        connection.release();
      }
    } catch (sendError) {
      console.error('Error sending email:', sendError);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});
