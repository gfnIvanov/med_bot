// импортируем зависимости
import TelegramBot from 'node-telegram-bot-api';
import DB from './db_actions/DbActions.js';
import UserData from './registration/UserData.js';
import LogTimeData from './log_time/LogTimeData.js';
import LogTimeReport from './reports/LogTimeReport.js';
import SupervisorReport from './reports/SupervisorReport.js';
import Process from './process/ProcessStates.js';
import { config } from '../config.js';

export default (() => {
  // создаем объект бота
  const bot = new TelegramBot(config.token, { polling: true });

  // Добавляем боту команды
  bot.setMyCommands([
    { command: 'reg', description: 'Регистрация в боте' },
    { command: 'menu', description: 'Главное меню' },
  ]);

  // создаем объект процесса
  const process = new Process();

  // создаем объект БД
  const db = new DB(config.db_path);

  // подключаемся к БД
  db.connect().then((result) => {
    process.checkDBState(result);
  });

  // обрабатываем команду-запрос на регистрацию
  bot.onText(/\/reg/, async (msg) => {
    if (msg.entities[0].type === 'bot_command') {
      // проверяем, что пользователя еще нет в базе
      db.checkUserExist(msg.from.username).then(async ({ status, result, error }) => {
        if (status) {
          if (result.queryResult > 0) {
            await bot.sendMessage(msg.chat.id, `Привет, ${msg.from.first_name}! Бот уже все о тебе знает, эта команда тебе больше не нужна`);
            process.ready();
          } else {
            process.setState('registration');
            process.setSubState('ready');
            await bot.sendMessage(msg.chat.id, `Привет, ${msg.from.first_name}! Чтобы начать работу с ботом нужно ответить на несколько вопросов`, {
              reply_markup: {
                inline_keyboard: [[{ text: 'Поехали!', callback_data: 'reg_run' }]],
              },
            });
          }
        } else {
          await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке пользователя: ${error}`);
          process.ready();
        }
      });
    }
  });

  // обрабатываем команду для открытия основного меню
  bot.onText(/\/menu/, async (msg) => {
    if (msg.entities[0].type === 'bot_command') {
      db.checkUserExist(msg.from.username).then(async ({ status, result, error }) => {
        if (status) {
          if (result.queryResult > 0) {
            process.ready();
            const main_menu = config.mainMenu.slice(0);
            if (config.supervisors.find((user) => user === msg.from.username)) {
              main_menu.push([
                {
                  text: 'Отчет для руководителя',
                  callback_data: 'super_reports',
                },
              ]);
            }
            db.checkExistsUserProjects(msg.from.username, 'OTTA').then(async ({ status, result, error }) => {
              if (status) {
                if (result.queryResult > 0) {
                  main_menu.push([
                    {
                      text: 'Учетные записи НИИ Отта',
                      callback_data: 'otta_vpn_accounts',
                    },
                  ]);
                }
                await bot.sendMessage(msg.chat.id, 'Основное меню', {
                  reply_markup: {
                    inline_keyboard: main_menu,
                  },
                });
              } else {
                await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке проектов пользователя: ${error}`);
                process.ready();
              }
            });
          } else {
            await bot.sendMessage(msg.chat.id, `Привет, ${msg.from.first_name}! Сначала воспользуйся командой reg, чтобы зарегистрироваться`);
            process.ready();
          }
        } else {
          await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке пользователя: ${error}`);
          process.ready();
        }
      });
    }
  });

  // ---------------------- Обработка коллбэков с кнопок меню ------------------------------
  bot.on('callback_query', async (msg) => {
    if (msg.data === 'reg_run') {
      if (process.state === 'registration' && process.sub_state === 'ready') {
        const userData = new UserData();
        userData.setIdent(msg.from.username);
        getUserName(userData, msg, true);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'log_time') {
      if (process.state === 'ready' && process.sub_state === 'ready') {
        process.setState('logTime');
        const logTimeData = new LogTimeData();
        logTimeData.ident = msg.from.username;
        getClientName(logTimeData, msg, true);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'report_log') {
      if (process.state === 'ready' && process.sub_state === 'ready') {
        process.setState('logReport');
        const logTimeData = new LogTimeData();
        getLogReportDateIn(logTimeData, msg, true);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'super_reports') {
      if (process.state === 'ready' && process.sub_state === 'ready') {
        getSupervisorReport(msg);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'otta_vpn_accounts') {
      if (process.state === 'ready' && process.sub_state === 'ready') {
        process.setState('vpnActions');
        await bot.sendMessage(msg.message.chat.id, 'Шо сделать?', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Занять',
                  callback_data: 'take_account',
                },
              ],
              [
                {
                  text: 'Освободить',
                  callback_data: 'release_account',
                },
              ],
            ],
          },
        });
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'take_account') {
      if (process.state === 'vpnActions' && process.sub_state === 'ready') {
        workWithOttaVpn(msg);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (msg.data === 'release_account') {
      if (process.state === 'vpnActions' && process.sub_state === 'ready') {
        releaseVpnAccount(msg, msg.from.username);
        bot.answerCallbackQuery(msg.id);
      }
    }
    if (/bars_vpn+/.exec(msg.data)) {
      if (process.state === 'vpnActions' && process.sub_state === 'awaitTakeVpn') {
        takeVpnAccount(msg, msg.from.username, msg.data);
        bot.answerCallbackQuery(msg.id);
      }
    }
  });

  // --------------------------------- Регистрация пользователя -------------------------------
  const getUserName = async (userData, msg, show_msg) => {
    process.setSubState('awaitName');
    if (show_msg) {
      await bot.sendMessage(msg.message.chat.id, 'Введи свои имя и фамилию');
    }
    bot.once('message', async (msg) => {
      if (process.state === 'registration' && process.sub_state === 'awaitName' && !msg.entities) {
        if (!userData.setName(msg.text)) {
          await bot.sendMessage(msg.chat.id, 'Обнаружены цифры или специсмволы, так не бывает');
          getUserName(userData, msg, false);
        } else {
          getUserLogin(userData, msg, true);
        }
      }
    });
  };

  const getUserLogin = async (userData, msg, show_msg) => {
    process.setSubState('awaitLogin');
    if (show_msg) {
      await bot.sendMessage(msg.chat.id, 'Введи свой корпоративный логин');
    }
    bot.once('message', async (msg) => {
      if (process.state === 'registration' && process.sub_state === 'awaitLogin' && !msg.entities) {
        if (!userData.setLogin(msg.text)) {
          await bot.sendMessage(msg.chat.id, 'В логинах БГ не бывает русских букв');
          getUserLogin(userData, msg, false);
        } else {
          getUserTeam(userData, msg, true);
        }
      }
    });
  };

  const getUserTeam = async (userData, msg, show_msg) => {
    process.setSubState('awaitTeam');
    const btns = [];
    await db.getProjects().then(async ({ status, result, error }) => {
      if (status) {
        result.forEach((project) => {
          btns.push([{
            text: project.PROJECT_NAME,
            callback_data: project.PROJECT_CODE,
          }]);
        });
      } else {
        await bot.sendMessage(msg.message.chat.id, `Ошибка при поиске проектов: ${error}`);
        process.ready();
      }
    });
    btns.push([{
      text: 'Дальше',
      callback_data: 'reg_continue',
    }]);
    if (show_msg) {
      await bot.sendMessage(msg.chat.id, 'Выбери проекты, над которыми ты работаешь.\nКогда выберешь все, нажми кнопку Дальше', {
        reply_markup: {
          inline_keyboard: btns,
        },
      });
    }
    bot.once('callback_query', async (msg) => {
      if (process.state === 'registration' && process.sub_state === 'awaitTeam') {
        if (msg.data === 'reg_continue') {
          if (!userData.regContinue()) {
            await bot.sendMessage(msg.message.chat.id, 'Не выбран ни один проект!');
          } else {
            db.addUser(userData.ident, userData.userName, userData.login)
              .then(async ({ status, error }) => {
                if (status) {
                  db.getLastUserId().then(async ({ status, result, error }) => {
                    if (status) {
                      db.addUserProjects(result.lastUserId, userData.projects)
                        .then(async ({ status, error }) => {
                          if (status) {
                            await bot.sendMessage(msg.message.chat.id, 'Пользователь успешно добавлен!');
                            process.ready();
                          } else {
                            await bot.sendMessage(msg.message.chat.id, `Ошибка при добавлении проекта: ${error}`);
                            process.ready();
                          }
                        });
                    } else {
                      await bot.sendMessage(msg.message.chat.id, `Ошибка при поиске ID пользователя: ${error}`);
                      process.ready();
                    }
                  });
                } else {
                  await bot.sendMessage(msg.message.chat.id, `Ошибка при добавлении пользователя: ${error}`);
                  process.ready();
                }
              });
          }
        } else {
          let project;
          btns.forEach((arr) => {
            const result = arr.find((item) => item.callback_data === msg.data);
            if (result) {
              project = result;
            }
          });
          if (!userData.setProject(msg.data)) {
            await bot.sendMessage(msg.message.chat.id, `Проект ${project.text} уже добавлен!`);
            getUserTeam(userData, msg, false);
          } else {
            await bot.sendMessage(msg.message.chat.id, `Добавлен проект ${project.text}`);
            getUserTeam(userData, msg, false);
          }
        }
        bot.answerCallbackQuery(msg.id);
      }
    });
  };

  // --------------------------------- Логирование времени --------------------------------
  const getClientName = async (logTimeData, msg) => {
    process.setSubState('awaitClientName');
    await bot.sendMessage(msg.message.chat.id, 'Введи ФИО пользователя, который поставил задачу');
    bot.once('message', async (msg) => {
      if (process.state === 'logTime' && process.sub_state === 'awaitClientName' && !msg.entities) {
        logTimeData.clientName = msg.text;
        getTaskText(logTimeData, msg);
      }
    });
  };

  const getTaskText = async (logTimeData, msg) => {
    process.setSubState('awaitTaskText');
    await bot.sendMessage(msg.chat.id, 'Опиши, что хотел пользователь');
    bot.once('message', async (msg) => {
      if (process.state === 'logTime' && process.sub_state === 'awaitTaskText' && !msg.entities) {
        logTimeData.taskText = msg.text;
        getTaskResult(logTimeData, msg);
      }
    });
  };

  const getTaskResult = async (logTimeData, msg) => {
    process.setSubState('awaitTaskResult');
    await bot.sendMessage(msg.chat.id, 'Введи описание результата работы над задачей');
    bot.once('message', async (msg) => {
      if (process.state === 'logTime' && process.sub_state === 'awaitTaskResult' && !msg.entities) {
        logTimeData.taskResult = msg.text;
        getTaskTime(logTimeData, msg, true);
      }
    });
  };

  const getTaskTime = async (logTimeData, msg, show_msg) => {
    process.setSubState('awaitTaskTime');
    if (show_msg) {
      await bot.sendMessage(msg.chat.id, 'Введи время в <b>минутах</b>, затраченное на работу с задачей', { parse_mode: 'HTML' });
    }
    bot.once('message', async (msg) => {
      if (process.state === 'logTime' && process.sub_state === 'awaitTaskTime' && !msg.entities) {
        if (!logTimeData.setTaskTime(msg.text)) {
          await bot.sendMessage(msg.chat.id, 'Никаких букв, только цифры! Можно в виде дроби, она округлится до ближайшего целого');
          getTaskTime(logTimeData, msg, false);
        } else {
          db.addUserLog(
            logTimeData.ident,
            logTimeData.clientName,
            logTimeData.taskText,
            logTimeData.taskResult,
            logTimeData.taskTime,
          ).then(async ({ status, error }) => {
            if (status) {
              await bot.sendMessage(msg.chat.id, 'Запись лога успешно добавлена!');
              process.ready();
            } else {
              await bot.sendMessage(msg.chat.id, `Ошибка при добавлении записи лога: ${error}`);
              process.ready();
            }
          });
        }
      }
    });
  };

  // -------------------------- Отчет по залогированному времени -----------------------------
  const getLogReportDateIn = async (logTimeData, msg, show_msg) => {
    process.setSubState('awaitLogReportDateIn');
    if (show_msg) {
      await bot.sendMessage(msg.message.chat.id, 'Введи дату начала периода поиска в формате dd.mm.yyyy');
    }
    bot.once('message', async (msg) => {
      if (process.state === 'logReport' && process.sub_state === 'awaitLogReportDateIn' && !msg.entities) {
        if (!logTimeData.setDateIn(msg.text)) {
          await bot.sendMessage(msg.chat.id, 'Некорректный формат даты!');
          getLogReportDateIn(logTimeData, msg, false);
        } else {
          getLogReportDateOut(logTimeData, msg, true);
        }
      }
    });
  };

  const getLogReportDateOut = async (logTimeData, msg, show_msg) => {
    process.setSubState('awaitLogReportDateIn');
    if (show_msg) {
      await bot.sendMessage(msg.chat.id, 'Введи дату окончания периода поиска в формате dd.mm.yyyy');
    }
    bot.once('message', async (msg) => {
      if (process.state === 'logReport' && process.sub_state === 'awaitLogReportDateIn' && !msg.entities) {
        if (!logTimeData.setDateOut(msg.text)) {
          await bot.sendMessage(msg.chat.id, 'Некорректный формат даты!');
          getLogReportDateOut(logTimeData, msg, false);
        } else {
          db.getLogReport(logTimeData.dateIn, logTimeData.dateOut)
            .then(async ({ status, result, error }) => {
              if (status) {
                const report = new LogTimeReport(result).getFile();
                if (report.status) {
                  await bot.sendDocument(msg.chat.id, report.file);
                  process.ready();
                } else {
                  await bot.sendMessage(msg.chat.id, `Ошибка при получении файла отчета: ${report.error}`);
                  process.ready();
                }
              } else {
                await bot.sendMessage(msg.chat.id, `Ошибка при формировании отчета: ${error}`);
                process.ready();
              }
            });
        }
      }
    });
  };

  // --------------------------- Формирование отчета для руководителя ---------------------------
  const getSupervisorReport = async (msg) => {
    Promise.all(
      [
        db.getSupervisorReport('users'),
        db.getSupervisorReport('projects'),
        db.getSupervisorReport('logs'),
        db.getSupervisorReport('vpn_accounts_log'),
      ],
    ).then(async (results) => {
      if (results.find((result) => (!result.status))) {
        await bot.sendMessage(msg.message.chat.id, `Ошибка при формировании отчета: ${results.find((result) => (result.error))}`);
        process.ready();
      } else {
        const report = new SupervisorReport(results).getFile();
        if (report.status) {
          await bot.sendDocument(msg.message.chat.id, report.file);
          process.ready();
        } else {
          await bot.sendMessage(msg.message.chat.id, `Ошибка при получении файла отчета: ${report.error}`);
          process.ready();
        }
      }
    });
  };

  // --------------------------- Работа с учетными записями НИИ Отта ---------------------------
  const workWithOttaVpn = async (msg) => {
    process.setSubState('awaitTakeVpn');
    db.checkFreeOttaVpn().then(async ({ status, result, error }) => {
      if (status) {
        if (result.length === 0) {
          await bot.sendMessage(msg.message.chat.id, 'Свободны все учетные записи, выбирай любую', {
            reply_markup: {
              inline_keyboard: config.otta_vpn_accounts,
            },
          });
        } else if (result.length === config.otta_vpn_accounts.length) {
          await bot.sendMessage(msg.message.chat.id, 'Все учетные записи заняты :(');
        } else {
          const accounts = result.map((res) => res.ACCOUNT);
          const btns = [];
          accounts.forEach((account) => {
            config.otta_vpn_accounts.forEach((vpn) => {
              if (vpn[0].text !== account) {
                btns.push(vpn);
              }
            });
          });
          await bot.sendMessage(msg.message.chat.id, 'Свободны следующие учетные записи:', {
            reply_markup: {
              inline_keyboard: btns,
            },
          });
        }
      } else {
        await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке свободных учетных записей: ${error}`);
        process.ready();
      }
    });
  };

  const takeVpnAccount = async (msg, user, account) => {
    db.checkUserOttaVpn(user).then(async ({ status, result, error }) => {
      if (status) {
        if (result) {
          await bot.sendMessage(msg.message.chat.id, `Ты уже занял учетную запись ${result.ACCOUNT}, одна запись в одни руки!`);
          process.ready();
        } else {
          db.takeVpnAccount(user, account).then(async ({ status, error }) => {
            if (status) {
              await bot.sendMessage(msg.message.chat.id, 'Учетная запись успешно занята, пользуйся с удовольствием');
              process.ready();
            } else {
              await bot.sendMessage(msg.message.chat.id, `Ошибка при попытке занять учетную запись: ${error}`);
              process.ready();
            }
          });
        }
      } else {
        await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке учетной записи, занятой пользователем: ${error}`);
        process.ready();
      }
    });
  };

  const releaseVpnAccount = async (msg, user) => {
    db.checkUserOttaVpn(user).then(async ({ status, result, error }) => {
      if (status) {
        if (!result) {
          await bot.sendMessage(msg.message.chat.id, 'У тебя нет активных учетных записей');
          process.ready();
        } else {
          db.releaseVpnAccount(result.ID).then(async ({ status, error }) => {
            if (status) {
              await bot.sendMessage(msg.message.chat.id, `Ты успешно освободил учетную запись ${result.ACCOUNT}`);
              process.ready();
            } else {
              await bot.sendMessage(msg.message.chat.id, `Ошибка при попытке освободить учетную запись: ${error}`);
              process.ready();
            }
          });
        }
      } else {
        await bot.sendMessage(msg.message.chat.id, `Ошибка при проверке учетной записи, занятой пользователем: ${error}`);
        process.ready();
      }
    });
  };
})();
