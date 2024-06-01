// server.js
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

let browser;

// Initialize the browser when the server starts
(async () => {
  browser = await puppeteer.launch({ headless: true });
})();

app.get('/check-registration', async (req, res) => {
  const { regoNumber } = req.query;

  if (!regoNumber) {
    return res.status(400).json({ error: 'Missing regoNumber query parameter' });
  }

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

    await page.goto('https://www.vicroads.vic.gov.au/registration/buy-sell-or-transfer-a-vehicle/check-vehicle-registration/vehicle-registration-enquiry', { waitUntil: 'domcontentloaded' });

    await page.select('#VehicleType', 'car');
    await page.type('#RegistrationNumbercar', regoNumber);

    await page.click('.mvc-form__actions-btn');
    
    await page.waitForSelector('.vhr-panel__list');

    const registrationInfo = await page.evaluate(() => {
      const getTextContent = (index) => document.querySelectorAll('.vhr-panel__list-item--description')[index]?.innerText || '';
      
      return {
        registrationNumber: getTextContent(0),
        registrationStatus: getTextContent(1),
        // registrationSerialNumber: getTextContent(2),
        year: getTextContent(3),
        make: getTextContent(4),
        bodyType: getTextContent(5),
        colour: getTextContent(6),
        // vinChassis: getTextContent(7),
        // engineNumber: getTextContent(8),
        compliancePlate: getTextContent(9),
        sanctionsApplicable: getTextContent(10),
        // goodsCarryingVehicle: getTextContent(11),
        transferInDispute: getTextContent(12),
      };
    });

    await page.close();

    res.json({ registrationInfo });
      } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gracefully close the browser when the server is stopped
process.on('exit', async () => {
  if (browser) {
    await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});