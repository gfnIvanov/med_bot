import path from 'path';
import Reports from './Reports.js';
import { config } from '../../config.js';

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
      this.xlsx.writeFile(this.book, path.join(config.reports_path.super_report, `${now}_result.xlsx`));
      return {
        status: true,
        file: path.join(config.reports_path.super_report, `${now}_result.xlsx`),
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
