import path from 'path';

export const config = {
  token: '',
  db_path: path.resolve('./database/db.db'),
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
  reports_path: {
    log_report: path.resolve('./src/reports/report_files/log_reports'),
    super_report: path.resolve('./src/reports/report_files/super_reports'),
  },
};
