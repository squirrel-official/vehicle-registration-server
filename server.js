// server.js
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');
const UserAgent = require('user-agents');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.get('/check-registration', async (req, res) => {
  let browser = await puppeteer.launch({ headless: false });
  const { regoNumber } = req.query;

  if (!regoNumber) {
    return res.status(400).json({ error: 'Missing regoNumber query parameter' });
  }

  let page;
  try {
    page = await browser.newPage();
    // Generate a random user agent
    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());

    await page.goto('https://service.vic.gov.au/find-services/transport-and-driving/registration/check-registration/vehicle', { waitUntil: 'domcontentloaded' });

    await page.type('#rego-number', regoNumber);
    await page.click('button.cta');

     // Wait for 3 seconds (3000 milliseconds)
    await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(resolve, 3000);
      });
    });


    const registrationInfo = await page.evaluate(() => {
      const info = {};
      const reviewList = document.querySelector('.review-list');
  
      reviewList.querySelectorAll('li').forEach(li => {
        const label = li.querySelector('label').textContent.trim();
        const value = li.querySelector('._value').textContent.trim();

        // Select only specific labels
        if (label === 'Make' || label === 'Body' || label === 'Registration' || label === 'Colour' || label === 'Expiry' || label === 'Sanction(s) applicable' || label === 'Transfer in dispute') {
          info[label] = value;
      }
      });
  
      return info;
    });

    await page.close();

    res.json({ registrationInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching registration details.' });
  }})


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});