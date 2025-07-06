const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Puppeteer script...');
  const browser = await puppeteer.launch({
    headless: true, // Use headless mode for server/VM
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Browser launched.');
  const page = await browser.newPage();
  await page.goto('https://bandit.camp/', { waitUntil: 'networkidle2' });
  console.log('Page loaded. Monitoring for rain event...');

  // Adjust selector as needed after inspecting the rain UI
  const rainSelector = '[class*=rain], [class*=Rain]';

  while (true) {
    try {
      const rain = await page.$(rainSelector);
      if (rain) {
        console.log('Rain event detected!');
        break;
      }
      console.log('No rain detected, checking again in 10s...');
      await new Promise(r => setTimeout(r, 10000));
    } catch (err) {
      console.error('Error monitoring for rain:', err);
      break;
    }
  }

  await browser.close();
})();

