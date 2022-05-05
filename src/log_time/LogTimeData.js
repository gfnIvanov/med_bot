import moment from 'moment';

export default class LogTimeData {
  setTaskTime(taskTime) {
    const value = Math.round(taskTime.replace(',', '.'));
    if (!/[0-9]/.test(value)) {
      return false;
    }
    this.taskTime = value;
    return true;
  }

  setDateIn(dateIn) {
    if (moment(dateIn, 'DD MM YYYY').isValid()) {
      const arr = dateIn.split('.').reverse();
      this.dateIn = arr.join('-');
      return true;
    }
    return false;
  }

  setDateOut(dateOut) {
    if (moment(dateOut, 'DD MM YYYY').isValid()) {
      const arr = dateOut.split('.').reverse();
      this.dateOut = arr.join('-');
      return true;
    }
    return false;
  }
}
