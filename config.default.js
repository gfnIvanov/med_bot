export const config = {
  token: '',
  db_path: '',
  mainMenu: [
    [
      {
        text: 'Логировать время',
        callback_data: 'log_time',
      },
    ],
    [
      {
        text: 'Отчет (лог)',
        callback_data: 'report_log',
      },
    ],
  ],
  supervisors: [
    'gfn_ivanov',
  ],
};
