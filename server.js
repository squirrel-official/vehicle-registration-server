const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const UserAgent = require('user-agents');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
puppeteer.use(StealthPlugin());

let browser;

(async () => {
  browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
})();

app.get('/check-registration', async (req, res) => {
  console.time('Execution Time');
  
  const { regoNumber } = req.query;

  if (!regoNumber) {
    console.timeEnd('Execution Time');
    return res.status(400).json({ error: 'Missing regoNumber query parameter' });
  }

  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    // Generate a random user agent
    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());

    await page.goto('https://www.vicroads.vic.gov.au/registration/buy-sell-or-transfer-a-vehicle/check-vehicle-registration/vehicle-registration-enquiry',
       { waitUntil: 'domcontentloaded',
         cacheDisabled: true  });

    await page.type('#RegistrationNumbercar', regoNumber);

    // Generate a timestamped filename for the screenshot
    // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // const screenshotPath = `screenshot-${timestamp}.jpg`;

    // Take a screenshot before interacting with the page
    // await page.screenshot({ path: screenshotPath, fullPage: true });
      
   // Wait for the "Search" button to be clickable and then click it
   await page.click('.mvc-form__actions-btn[value="Search"]');
    

    await page.waitForSelector('.vhr-panel__list-item--description', { timeout: 5000 });

    const registrationInfo = await page.evaluate(() => {
      const getTextContent = (index) => document.querySelectorAll('.vhr-panel__list-item--description')[index]?.innerText || '';
      
      return {
        registrationNumber: getTextContent(0),
        registrationStatus: getTextContent(1),
        bodyType: getTextContent(5),
        colour: getTextContent(6),
        sanctionsApplicable: getTextContent(10),
        transferInDispute: getTextContent(12),
      };
    });

    await page.close();

    console.timeEnd('Execution Time');
    res.json({ registrationInfo, screenshotPath });
  } catch (error) {
    console.error(error);
    console.timeEnd('Execution Time');
    res.status(500).json({ error: 'An error occurred while fetching registration details.' });
    // if (page) await page.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
