import Reports from './Reports.js';

export default class SupervisorReport extends Reports {
  constructor(superReportData) {
    super();
    this.data = superReportData;
  }

  getFile() {
    try {
      const now = this.moment().format('DD-MM-YYYY-hh-mm-ss');
      this.data.forEach((data) => {
        const sheet = this.xlsx.utils.json_to_sheet(data.result);
        this.xlsx.utils.book_append_sheet(this.book, sheet, data.list);
      });
      this.xlsx.writeFile(this.book, `src\\reports\\report_files\\super_reports\\${now}_result.xlsx`);
      return {
        status: true,
        file: `src\\reports\\report_files\\super_reports\\${now}_result.xlsx`,
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
