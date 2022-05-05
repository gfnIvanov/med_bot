import xlsx from 'xlsx';
import moment from 'moment';

export default class Reports {
  constructor() {
    this.xlsx = xlsx;
    this.moment = moment;
    this.book = xlsx.utils.book_new();
  }
}
