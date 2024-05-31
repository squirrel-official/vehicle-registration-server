// server.js
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.post('/submit', async (req, res) => {
  const { regoNumber } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');

    await page.goto('https://www.vicroads.vic.gov.au/registration/buy-sell-or-transfer-a-vehicle/check-vehicle-registration/vehicle-registration-enquiry');
    
    await page.screenshot({ path: 'full_page_screenshot.png', fullPage: true });
    await page.waitForSelector('#VehicleType', { visible: true });
    await page.select('#VehicleType', 'car');
    await page.type('#RegistrationNumbercar', regoNumber);
  
    // Wait for the button to appear
    await page.waitForSelector('.mvc-form__actions-btn');

    // Click the button
    await page.click('.mvc-form__actions-btn');
    // await page.click('#submit-button'); // Update this selector to the actual button's selector

    // Wait for the results to load and get the content
    // Wait for the registration information to appear
    await page.waitForSelector('.vhr-panel__list');

  // Extract the registration information
    const registrationInfo = await page.evaluate(() => {
    const registrationNumber = document.querySelectorAll('.vhr-panel__list-item--description')[0].innerText;
    const registrationStatus = document.querySelectorAll('.vhr-panel__list-item--description')[1].innerText
    const registrationSerialNumber = document.querySelectorAll('.vhr-panel__list-item--description')[2].innerText;
    const year = document.querySelectorAll('.vhr-panel__list-item--description')[3].innerText;
    const make = document.querySelectorAll('.vhr-panel__list-item--description')[4].innerText;
    const bodyType = document.querySelectorAll('.vhr-panel__list-item--description')[5].innerText;
    const colour = document.querySelectorAll('.vhr-panel__list-item--description')[6].innerText;
    const vinChassis = document.querySelectorAll('.vhr-panel__list-item--description')[7].innerText;
    const engineNumber = document.querySelectorAll('.vhr-panel__list-item--description')[8].innerText;
    const compliancePlate = document.querySelectorAll('.vhr-panel__list-item--description')[9].innerText;
    const sanctionsApplicable = document.querySelectorAll('.vhr-panel__list-item--description')[10].innerText;
    const goodsCarryingVehicle = document.querySelectorAll('.vhr-panel__list-item--description')[11].innerText;
    const transferInDispute = document.querySelectorAll('.vhr-panel__list-item--description')[12].innerText;

    return {
      registrationNumber,
      registrationStatus,
      registrationSerialNumber,
      year,
      make,
      bodyType,
      colour,
      vinChassis,
      engineNumber,
      compliancePlate,
      sanctionsApplicable,
      goodsCarryingVehicle,
      transferInDispute
    };
  });

  console.log('Registration Information:', registrationInfo);

    // await browser.close();

    res.json({ registrationInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

