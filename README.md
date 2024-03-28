# serverless

This repository contains a Cloud Function implemented in Node.js that integrates Google Cloud Pub/Sub with Mailgun to send email verification links to new user accounts. The Cloud Function is triggered when a message is published to the Pub/Sub topic, typically when a new user account is created.

## Prerequisites

Before using this Cloud Function, ensure you have the following set up:

- Google Cloud Platform account with Pub/Sub API enabled
- Mailgun account with an API key and domain
- MySQL database credentials for CloudSQL instance (the same used by your web application)

## Setup

1. Install dependencies:

   ```bash
   npm install

2. Set up environment variables

## Functionality

The Cloud Function performs the following tasks:

1. Email Verification Link:

    - When triggered, the function extracts the user's information (username, first name, last name, verification token) from the Pub/Sub message.
    - It generates a verification link that expires after 2 minutes and emails it to the user using Mailgun.

2.  Tracking Emails Sent:

    - After sending the email, the function updates the user's record in the CloudSQL database.
    - It logs the email sent status and updates the verificationEmailSentAt timestamp for the user.

The low expiration time of 2 minutes for the verification link is set for demonstration purposes and can be adjusted as needed for production.
