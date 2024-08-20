# Scholarship Scraper

This project is a web scraper built using Node.js and Puppeteer to scrape scholarship data from the CareerOneStop website. The script extracts details about scholarships, including their name, description, award amount, level of study, application deadlines, and more. The scraped data is then saved to an Excel file (`.xlsx`), with specific formatting applied to the scholarship amount and application deadline fields.

## Features

- Scrapes multiple pages of scholarships.
- Cleans and formats scholarship amounts by removing `$` signs and commas.
- Converts month names in deadlines to a formatted date (`MM.01.YYYY`).
- Dynamically determines whether the deadline belongs to the current year or the next based on the current date.
- Associates specific scholarship amounts with corresponding images.
- Saves the scraped data to an Excel file.

## Requirements

- Node.js (v12.0.0 or later)
- npm (Node Package Manager)

## Dependencies

- [Puppeteer](https://pptr.dev/): A Node library which provides a high-level API to control Chrome or Chromium.
- [XLSX](https://github.com/SheetJS/sheetjs): A library to parse and write spreadsheet files.
