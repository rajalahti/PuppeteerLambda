# PuppeteerLambda
Puppeteer on AWS Lambda

## What it does
- Uses Serverless Framework to deploy a Lambda function on AWS 
- The function uses Lambda layers to load the puppeteer library used for PDF creation (can also be used for screenshots etc.)
- Function expects to be triggered by a POST request from a rest API on AWS Api Gateway (has to be setup separately)
- Lambda uses Puppeteer to create a PDF and saves it to an S3 bucket (which is created by serverless)


## How to use
- First install Serverless and setup an AWS account
- Npm install
- Sls deploy
- Log into AWS, find the created lambda function and add a trigger (API gateway Rest API) and a POST request
- Send POST request with a webpage url which you want to create a PDF from. Example request body: { "url": "https://www.gutenberg.org/cache/epub/11296/pg11296.html" }

--> A PDF is created and returned as a response. The file is saved to the S3 bucket

## Other stuff
- The PDF's will be tagged and accessible
- PDF metadata can be added.

Example payload: 
```
{
    "url": "https://www.rajalahti.me",
    "creator": "Juhani Rajalahti",
    "producer": "Juhani",
    "keywords": ["homepage", "pdf-test"],
    "subject": "personal page",
    "title": "Juhanin Portfolio",
    "author": "Juhani Rajalahti"
}
```
