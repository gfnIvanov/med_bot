import path from 'path';

export const config = {
  // токен бота
  token: '',
  // путь к файлу БД
  db_path: path.resolve('./database/db.db'),
  // пункты главного меню по умолчанию
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
  // пользователи с правом просмотра отчета для руководителя
  supervisors: [
    'gfn_ivanov',
  ],
  // пути до директорий с файлами отчетов
  reports_path: {
    log_report: path.resolve('./src/reports/report_files/log_reports'),
    super_report: path.resolve('./src/reports/report_files/super_reports'),
  },
  // учетные записи для доступа к Отта через ВПН
  otta_vpn_accounts: [
    [
      {
        text: 'bars_vpn1',
        callback_data: 'bars_vpn1',
      },
    ],
    [
      {
        text: 'bars_vpn2',
        callback_data: 'bars_vpn2',
      },
    ],
    [
      {
        text: 'bars_vpn3',
        callback_data: 'bars_vpn3',
      },
    ],
  ],
};
