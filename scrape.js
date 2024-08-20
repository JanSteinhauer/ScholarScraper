const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const url = 'https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx?&curPage=1';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    let allScholarships = [];

    const scrapePage = async () => {
        // Wait for 3 seconds to ensure the page is fully loaded
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Scrape the scholarship data
        const scholarships = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table.cos-table-responsive tbody tr'));

            const getImageUrl = (amount) => {
                if (amount === '$1,000') {
                    return 'https://firebasestorage.googleapis.com/v0/b/studentevaluation-9d972.appspot.com/o/scholarshipNumbers%2F1000.png?alt=media&token=4e9edb76-52cd-4659-9bc5-12e7c244d921';
                } else if (amount === '$2,000') {
                    return 'https://firebasestorage.googleapis.com/v0/b/studentevaluation-9d972.appspot.com/o/scholarshipNumbers%2F2000.png?alt=media&token=dfce35a5-5c03-40f9-8c1b-56949ce5fa4b';
                } else if (amount === '$1,500') {
                    return 'https://firebasestorage.googleapis.com/v0/b/studentevaluation-9d972.appspot.com/o/scholarshipNumbers%2F1500.png?alt=media&token=39664c5a-6ba3-4bc7-88b2-fad742afaa72';
                } else {
                    return ''; // Default or no image
                }
            };

            return rows.map(row => {
                const name = row.querySelector('td[data-label-es="Award Name"] a')?.innerText.trim();
                const description = row.querySelector('td[data-label-es="Award Name"] div:nth-child(3)')?.innerText.trim();
                const levelOfStudy = row.querySelector('td[data-label-es="Level Of Study"]')?.innerText.trim();
                const awardType = row.querySelector('td[data-label-es="Award Type"]')?.innerText.trim();
                const awardAmount = row.querySelector('td[data-label-es="Award Amount"] .table-Numeric')?.innerText.trim();
                const deadline = row.querySelector('td[data-label-es="Deadline"]')?.innerText.trim();
                const link = row.querySelector('td[data-label-es="Award Name"] a')?.href;
                const imageUrl = getImageUrl(awardAmount);
                
                return {
                    ScholarshipName: name || '',
                    Description: description || '',
                    Categories: levelOfStudy || '',
                    ApplicationTime: '',  // Placeholder
                    ScholarshipAmount: awardAmount || '',
                    EssayRequired: '',  // Placeholder
                    ApplicationDeadline: deadline || '',
                    Image: imageUrl,  // Image based on scholarship amount
                    Link: link || ''
                };
            });
        });

        allScholarships = allScholarships.concat(scholarships);
    };

    for (let i = 0; i < 6; i++) {
        await scrapePage();

        if (i < 5) { // Only click "Next" if we have more pages to scrape
            const nextPageButton = await page.$('a.next[aria-label="next page"]');
            if (nextPageButton) {
                await nextPageButton.click();
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
            } else {
                console.log('No more pages to navigate.');
                break;
            }
        }
    }

    // Close the browser
    await browser.close();

    // Convert the data to an Excel file
    const worksheet = XLSX.utils.json_to_sheet(allScholarships);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scholarships');

    // Save the file
    const filePath = path.join(__dirname, 'scholarships.xlsx');
    XLSX.writeFile(workbook, filePath);

    console.log(`Scraped ${allScholarships.length} scholarships`);
    console.log(`Data saved to ${filePath}`);
})();
