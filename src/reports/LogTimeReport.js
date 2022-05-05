import Reports from './Reports.js';

export default class LogTimeReport extends Reports {
  constructor(logReportData) {
    super();
    this.data = logReportData;
  }

  getFile() {
    try {
      const now = this.moment().format('DD-MM-YYYY-hh-mm-ss');
      const sheet = this.xlsx.utils.json_to_sheet(this.data);
      this.xlsx.utils.book_append_sheet(this.book, sheet, 'Результаты');
      this.xlsx.writeFile(this.book, `src\\reports\\report_files\\log_reports\\${now}_result.xlsx`);
      return {
        status: true,
        file: `src\\reports\\report_files\\log_reports\\${now}_result.xlsx`,
        error: null,
      };
    } catch (e) {
      return {
        status: false,
        file: null,
        error: e,
      };
    }
  }
}
