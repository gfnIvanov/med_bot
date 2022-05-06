import path from 'path';
import Reports from './Reports.js';
import { config } from '../../config.js';

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
      this.xlsx.writeFile(this.book, path.join(config.reports_path.log_report, `${now}_result.xlsx`));
      return {
        status: true,
        file: path.join(config.reports_path.log_report, `${now}_result.xlsx`),
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
