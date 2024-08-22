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

    const getImageUrl = (amount) => {
        // Mapping specific amounts to image URLs
        if (amount === '1000') {
            return 'https://example.com/images/1000.png';
        } else if (amount === '2000') {
            return 'https://example.com/images/2000.png';
        } else if (amount === '2500') {
            return 'https://example.com/images/2500.png';
        } else {
            return ''; // Default or no image
        }
    };

    const scrapePage = async () => {
        await page.waitForSelector('.main-content', { timeout: 60000 });

        const scholarshipLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a.fullwidth')).map(link => link.href);
            return links;
        });

        for (let link of scholarshipLinks) {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const scholarship = await page.evaluate(() => {
                // Redefine the getImageUrl function inside evaluate
                const getImageUrl = (amount) => {
                    if (amount === '1000') {
                        return 'https://example.com/images/1000.png';
                    } else if (amount === '2000') {
                        return 'https://example.com/images/2000.png';
                    } else if (amount === '2500') {
                        return 'https://example.com/images/2500.png';
                    } else {
                        return ''; // Default or no image
                    }
                };

                const name = document.querySelector('h1')?.innerText.trim();
                const amountText = document.querySelector('.award_value h6')?.innerText.trim();
                let deadline = document.querySelector('.sh_left h6')?.innerText.trim();
                const description = document.querySelector('.sh_left p')?.innerText.trim();
                const applyLink = document.querySelector('a.btn_apply.ajax_apply')?.href;

                const getElementText = (selector, text) => {
                    const elements = document.querySelectorAll(selector);
                    for (let element of elements) {
                        if (element.innerText.includes(text)) {
                            return element;
                        }
                    }
                    return null;
                };

                const eligibilityElement = getElementText('h2', 'Eligibility Requirements');
                const applicationElement = getElementText('h2', 'Application Requirements');

                const eligibility = eligibilityElement
                    ? Array.from(eligibilityElement.nextElementSibling.querySelectorAll('li')).map(li => li.innerText.trim())
                    : [];

                const applicationReqs = applicationElement
                    ? Array.from(applicationElement.nextElementSibling.querySelectorAll('li')).map(li => li.innerText.trim())
                    : [];

                const noEssayOrGPA = document.body.innerText.includes("no essay or minimum GPA required");

                // Extract numeric value from amountText
                const amount = amountText ? amountText.replace(/[^0-9]/g, '') : '';

                // Determine if an essay or GPA requirement is mentioned
                const isEssayRequired = noEssayOrGPA ? 0 : 1;
                const isGPARequired = noEssayOrGPA ? 0 : 1;

                // Format deadline
                console.log("deadline1", deadline);
                if (deadline && deadline.match(/^\d{2}\/\d{2}$/)) {
                    console.log("deadline", deadline);
                    const [month, day] = deadline.split('/');
                    deadline = `${month}/01/2025`; // Assuming all deadlines are for the year 2025
                }

                const imageUrl = getImageUrl(amount);

                return {
                    ScholarshipName: name || '',
                    amount: amount || '0',
                    ApplicationDeadline: deadline || 'Deadline not specified',
                    Description: description || 'No description available',
                    EligibilityRequirements: eligibility.join(', ') || 'Eligibility not specified',
                    ApplicationRequirements: applicationReqs.join(', ') || 'Requirements not specified',
                    isEssayRequired: isEssayRequired,
                    isGPARequired: isGPARequired,
                    Image: imageUrl,
                    Link: applyLink || ''
                };
            });

            allScholarships.push(scholarship);
        }
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

    // Export to Excel
    const worksheet = XLSX.utils.json_to_sheet(allScholarships);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scholarships');

    const filePath = path.join(__dirname, 'access_scholarships.xlsx');
    XLSX.writeFile(workbook, filePath);

    // Export to JSON
    const jsonFilePath = path.join(__dirname, 'access_scholarships.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(allScholarships, null, 2), 'utf-8');

    console.log(`Scraped ${allScholarships.length} scholarships`);
    console.log(`Data saved to ${filePath} and ${jsonFilePath}`);
})();
