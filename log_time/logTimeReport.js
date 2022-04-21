const xlsx   = require('xlsx');
const moment = require('moment');

class LogTimeReport {
    constructor(logReportData) {
        this.data = logReportData;
        this.book = xlsx.utils.book_new();
    }
    
    getFile = () => {
        try {
            const now = moment().format('DD-MM-YYYY-hh-mm-ss');
            const table = xlsx.utils.json_to_sheet(this.data);
            xlsx.utils.book_append_sheet(this.book, table, 'Результаты');
            xlsx.writeFile(this.book, `log_time\\report_files\\${now}_result.xlsx`);
            return {
                status: true,
                file: `log_time\\report_files\\${now}_result.xlsx`,
                error: null
            }
        } catch(e) {
            return {
                status: false,
                file: null,
                error: e
            }
        }
    }
}

module.exports = LogTimeReport;