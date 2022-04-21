const moment = require('moment');

class LogTimeData {
    constructor() {
        this.ident;
        this.clientName;
        this.taskText,
        this.taskResult,
        this.taskTime,
        this.dateIn,
        this.dateOut
    }

    setTaskTime = (taskTime) => {
        let value = Math.round(taskTime.replace(',', '.'));
        if (!/[0-9]/.test(value)) {
            return false;
        } else {
            this.taskTime = value;
            return true;
        }
    }

    setDateIn = (dateIn) => {
        if (moment(dateIn, 'DD MM YYYY').isValid()) {
            let arr = dateIn.split('.').reverse();
            this.dateIn = arr.join('-');
            return true;
        } else {
            return false;
        }
    }

    setDateOut = (dateOut) => {
        if (moment(dateOut, 'DD MM YYYY').isValid()) {
            let arr = dateOut.split('.').reverse();
            this.dateOut = arr.join('-');
            return true;
        } else {
            return false;
        }
    }
}

module.exports = LogTimeData;