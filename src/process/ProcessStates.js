export default class Process {
  constructor() {
    this._states = [
      'ready',
      'registration',
      'logTime',
      'logReport',
      'vpnActions',
      'errorDBconnect',
    ];
    this._sub_states = [
      'ready',
      'awaitName',
      'awaitLogin',
      'awaitTeam',
      'awaitClientName',
      'awaitTaskText',
      'awaitTaskResult',
      'awaitTaskTime',
      'awaitLogReportDateIn',
      'awaitTakeVpn',
      'awaitLogReportDateOut',
    ];
  }

  checkDBState({ status, err }) {
    if (status) {
      this.setState('ready');
      console.log(`Process status: ${this.state}`);
    } else {
      this.setState('errorDBconnect');
      console.error(`Process status: ${this.state} -`, err);
    }
  }

  setState(state) {
    if (this._states.indexOf(state) !== -1) {
      this.state = state;
    } else {
      console.error('Передано некорректное состояние процесса');
    }
  }

  setSubState(sub_state) {
    if (this._sub_states.indexOf(sub_state) !== -1) {
      this.sub_state = sub_state;
    } else {
      console.error('Передано некорректное состояние подпроцесса');
    }
  }

  ready() {
    this.setState('ready');
    this.setSubState('ready');
  }
}
