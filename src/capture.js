// this module will be provided by the layer
const chromeLambda = require('chrome-aws-lambda');
// aws-sdk is always preinstalled in AWS Lambda in all Node.js runtimes
const S3Client = require('aws-sdk/clients/s3');
// require PDF-lib for metadata
const { PDFDocument } = require('pdf-lib');

// create an S3 client
const s3 = new S3Client({ region: process.env.S3_REGION });

const headers = {
	'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
	// Direct post request further
	if (event.httpMethod === 'POST') {
		return getPdf(event);
	}
};

// The function to run
const getPdf = async (event) => {
	const body = JSON.parse(event.body);
	const url = body.url;
	const { title, author, subject, keywords, producer, creator, creationDate, modificationDate } = body;

	if (!url) {
		return {
			statusCode: 400,
			headers,
			body: 'Send a url for pdf generation in the request body!',
		};
	}

	// launch a headless browser
	const browser = await chromeLambda.puppeteer.launch({
		args: [
			'--export-tagged-pdf',
			'--autoplay-policy=user-gesture-required',
			'--disable-background-networking',
			'--disable-background-timer-throttling',
			'--disable-backgrounding-occluded-windows',
			'--disable-breakpad',
			'--disable-client-side-phishing-detection',
			'--disable-component-update',
			'--disable-default-apps',
			'--disable-dev-shm-usage',
			'--disable-domain-reliability',
			'--disable-extensions',
			'--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
			'--disable-hang-monitor',
			'--disable-ipc-flooding-protection',
			'--disable-offer-store-unmasked-wallet-cards',
			'--disable-popup-blocking',
			'--disable-print-preview',
			'--disable-prompt-on-repost',
			'--disable-renderer-backgrounding',
			'--disable-setuid-sandbox',
			'--disable-speech-api',
			'--disable-sync',
			'--disable-web-security',
			'--disk-cache-size=33554432',
			'--hide-scrollbars',
			'--ignore-gpu-blocklist',
			'--metrics-recording-only',
			'--mute-audio',
			'--no-default-browser-check',
			'--no-first-run',
			'--no-pings',
			'--no-sandbox',
			'--no-zygote',
			'--password-store=basic',
			'--use-gl=swiftshader',
			'--use-mock-keychain',
			'--window-size=1920,1080',
			'--single-process',
		],
		defaultViewport: chromeLambda.defaultViewport,
		executablePath: await chromeLambda.executablePath,
	});

	// Open a page and navigate to the url
	const page = await browser.newPage();
	await page.goto(url, {
		waitUntil: 'networkidle2',
	});

	// Create PDF
	const buffer = await page.pdf({
		format: 'a4',
		printBackground: true,
		margin: {
			top: 50,
			bottom: 50,
			left: 30,
			right: 30,
		},
	});

	const pdfDoc = await PDFDocument.load(buffer);

	// Note that these fields are visible in the "Document Properties" section of
	// most PDF readers.
	title ? pdfDoc.setTitle(title) : "";
	author ? pdfDoc.setAuthor(author): "";
	subject ? pdfDoc.setSubject(subject) : "";
	keywords ? pdfDoc.setKeywords(keywords) : "";
	producer ? pdfDoc.setProducer(producer) : "";
	creator ? pdfDoc.setCreator(creator) : "";
	creationDate ? pdfDoc.setCreationDate(new Date(creationDate)) : pdfDoc.setCreationDate(new Date());
	modificationDate ? pdfDoc.setModificationDate(new Date(modificationDate)) : "";

	const data = await pdfDoc.saveAsBase64();

	// upload the pdf using the current timestamp as filename
	const result = await s3
		.upload({
			Bucket: process.env.S3_BUCKET,
			Key: `${Date.now()}.pdf`,
			Body: new Buffer.from(data, "base64"),
			ACL: 'public-read',
		})
		.promise();

	// return the uploaded image url
	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({ url: result.Location }),
	};
};
