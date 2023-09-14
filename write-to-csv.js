const { appendFile } = require('fs');

const writeToFile = (data) => {
    console.log(data)
    const csvContent = data.map(row => row.map((value,index) => {
        return (index != 0) ?  value.replace(',','-') : value;
        }).join(',')).join('\n') + '\n';
    appendFile('output.csv', csvContent, (err) => {
        if(err){
            console.error("error occured while adding data to csv file..\n", err);
        }
    })
}

module.exports = writeToFile;