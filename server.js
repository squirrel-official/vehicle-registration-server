// server.js
const express = require('express');
const bodyParser = require('body-parser');
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const cors = require('cors');
const UserAgent = require('user-agents');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
puppeteer.use(StealthPlugin())
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

app.get('/check-registration', async (req, res) => {
  
  let browser = await puppeteer.launch({ headless: true });
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

    await page.goto('https://www.vicroads.vic.gov.au/registration/buy-sell-or-transfer-a-vehicle/check-vehicle-registration/vehicle-registration-enquiry', { waitUntil: 'domcontentloaded' });

    await page.type('#RegistrationNumbercar', regoNumber);

   // Check if the "OK" button exists
   const buttonSelector = '.cookie-notification__button.cookie-notification__dismiss';
   const button = await page.$(buttonSelector);
   if (button) {
     await page.click(buttonSelector);
   }
   
  //  await page.screenshot({path: 'screenshot1.jpg', fullPage: true });

    await delay(1000)
    await page.click('.mvc-form__actions-btn');
    await delay(2000)
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

    res.json({ registrationInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching registration details.' });
  }})


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});