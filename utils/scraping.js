import puppeteer from 'puppeteer';

//get price froma an url and return an array of prices

export const getPrices = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const prices = await page.evaluate(() => {
        const prices = document.querySelectorAll('.price');
        return Array.from(prices).map((price) => price.textContent);
    });
    await browser.close();
    return prices;
    };

// Path: utils/index.js



// Path: index.js

