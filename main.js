const puppeteer = require('puppeteer');
const addToFile = require('./write-to-csv');
const { writeFile } = require('fs')

// create csv file header
const csv_header = ',link,name,state,record_last_update,status,issued_date,expiration_date';
writeFile('./output.csv', csv_header + '\n', (err) => {
    if (err) {
        console.error('error occuerd while writing csv file header...');
    }
})


let counter = 0;
const start = async (id, lastId) => {
    //starting point
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();

    await page.goto('https://app.cpaverify.org/') //going to main page

    //agree to terms and conditions checkbox selector
    const termsCheckBoxSelector = `#page_content > fieldset > form > table:nth-child(5) > tbody > tr:nth-child(3) > td > input[type=checkbox]`;

    //check agree to terms and conditions chechbox
    await page.click(termsCheckBoxSelector);
    console.log("agreed to terms");

    //last name textbox selector
    const lastNameInputSelector = `#ind_form > table > tbody > tr > td:nth-child(2) > input[type=text]`;

    //fill last name input
    await page.locator(lastNameInputSelector).fill('A');

    //search button selector
    const searchBtnSelector = `#submitButton`;

    //click on search button
    await page.locator(searchBtnSelector).click();

    //wait for result table to appear
    await page.waitForSelector(`#page_content > fieldset > div > div.data_table > table`);
    console.log("table found");

    //ids starts from:
    let status = true;

    do {
        //go to page
        try {
            if (id == lastId) {
                break;
            }
            const pageUrl = `https://app.cpaverify.org/view_licensee?id=${id}`;
            await page.goto(pageUrl);
            console.log("opend page:", pageUrl);
            id++;

            //check validation of website
            const details_table_selector = `#page_content > fieldset > div > div:nth-child(4) > table`;
            const isExist = await page.$(details_table_selector);
            if(!isExist){
                if(await page.$(lastNameInputSelector)){
                    console.error("we got caught..");
                    return start(id,lastId);
                }else{
                    console.log(`page with id ${id} is not exist`);
                    continue;
                }
            }
            counter++;

            const data = await page.evaluate((pageUrl, counter) => {
                let result =  Array.from(document.querySelectorAll(`#page_content > fieldset > div.xdata_block`));
                result.splice(0, 1); //remove the first block (empty)
                return result.map((doc) => {
                    const name = doc.querySelector('.jurisdiction_header > strong').innerText;
                    const state = doc.querySelector(`.xdata_block > .datarow > a > strong`).innerText;
                    const recordLastUpdated = doc.querySelector(`.xdata_block > .datarow > div:nth-child(2) > strong`).innerText.replace('\n','');
                    const status = doc.querySelector(`.datarow > table > tbody > tr:nth-child(4) > td:nth-child(2)`).innerText.split('(Details)')[0];
                    const issuedDate = doc.querySelector(`.datarow > table > tbody > tr:nth-child(7) > td:nth-child(2)`).innerText;
                    const expirationDate = doc.querySelector(`div.datarow:nth-child(4) > table > tbody > tr:nth-child(8) > td:nth-child(2)`).innerText;
                    const link = pageUrl;
                    const index = counter;

                    return [
                        index,link, name, state, recordLastUpdated, status, issuedDate, expirationDate
                    ]
                })

            }, pageUrl, counter);
            await addToFile(data);


            // //reading name element
            // const nameSelector = `#page_content > fieldset > div:nth-child(9) > div.jurisdiction_header > strong`;
            // await page.waitForSelector(nameSelector);
            // const name = await page.$eval(nameSelector, el => el.innerText);
            // //reading state
            // const stateSelector = `#page_content > fieldset > div:nth-child(9) > div:nth-child(2) > a > strong`;
            // const state = await page.$eval(stateSelector, el => el.innerText);
            // // get record_last_updated
            // const lastUpdateSelector = `#page_content > fieldset > div:nth-child(9) > div:nth-child(2) > div:nth-child(2) > strong`;
            // const lastUpdate = await page.$eval(lastUpdateSelector, el => el.innerText);
            // //get status
            // const statusSelector = `#page_content > fieldset > div:nth-child(9) > div:nth-child(4) > table > tbody > tr:nth-child(4) > td:nth-child(2)`;
            // const status = (await page.$eval(statusSelector, el => el.innerText)).split('(Details)')[0];
            // // get issued_date
            // const issuedDateSelector = `#page_content > fieldset > div:nth-child(9) > div:nth-child(4) > table > tbody > tr:nth-child(7) > td:nth-child(2)`;
            // const issuedDate = await page.$eval(issuedDateSelector, el => el.innerText);
            // //get expiration_date
            // const expirationDateSelector = `#page_content > fieldset > div:nth-child(9) > div:nth-child(4) > table > tbody > tr:nth-child(8) > td:nth-child(2)`;
            // const expirationDate = await page.$eval(expirationDateSelector, el => el.innerText);
            // //create array
            // const data = [pageUrl, name, state, lastUpdate, status, issuedDate, expirationDate];
            // await addToFile(data);
        }catch(e){
            console.log("err with page id:", id, "\n",e);
        }
        // await page.waitForTimeout(500);
    } while(status);

    // page.close();
}

let starting_id = 395900000;
start(starting_id, starting_id + 50000);