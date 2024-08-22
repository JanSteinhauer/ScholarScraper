const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const url = 'https://accessscholarships.com/search-scholarships/?scholarship_search=yes&sf=Y&incstate=TX&gpa=3.8&e=5&sa[]=0&ys=1&gender=1';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    let allScholarships = [];

    const scrapePage = async () => {
        await page.waitForSelector('.main-content', { timeout: 60000 });

        const scholarships = await page.evaluate(() => {
            const scholarshipArticles = document.querySelectorAll('article.styled');
            
            return Array.from(scholarshipArticles).map(article => {
                const name = article.querySelector('h2')?.innerText.trim();
                const amount = article.querySelector('.pp-content-grid-post-meta span:first-child')?.innerText.trim();
                const deadline = article.querySelector('.pp-content-grid-post-meta span:nth-child(3)')?.innerText.trim();
                const description = article.querySelector('p')?.innerText.trim();
                const link = article.querySelector('a.fullwidth')?.href;

                return {
                    ScholarshipName: name || '',
                    ScholarshipAmount: amount || 'Amount not specified',
                    ApplicationDeadline: deadline || 'Deadline not specified',
                    Description: description || 'No description available',
                    Link: link || ''
                };
            });
        });

        allScholarships = allScholarships.concat(scholarships);
    };

    for (let i = 0; i < 5; i++) {
        await scrapePage();

        const nextPageButton = await page.$('a.next.page-numbers');
        if (nextPageButton) {
            await nextPageButton.click();
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
        } else {
            console.log('No more pages to navigate.');
            break;
        }
    }

    await browser.close();

    const worksheet = XLSX.utils.json_to_sheet(allScholarships);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scholarships');

    const filePath = path.join(__dirname, 'access_scholarships.xlsx');
    XLSX.writeFile(workbook, filePath);

    console.log(`Scraped ${allScholarships.length} scholarships`);
    console.log(`Data saved to ${filePath}`);
})();
