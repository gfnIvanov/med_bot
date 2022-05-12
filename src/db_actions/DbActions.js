import sqlite from 'sqlite3';

export default class DB {
  constructor(path) {
    this.path = path;
  }

  connect() {
    return new Promise((res) => {
      this.db = new sqlite.Database(this.path, async (err) => {
        if (err) {
          res({
            status: false,
            error: err.message,
          });
        } else {
          res({
            status: true,
            error: null,
          });
        }
      });
    });
  }

  checkUserExist(ident) {
    return new Promise((res) => {
      this.db.get(`select count(*) queryResult
                     from D_USERS u
                    where u.USER_ID = $ident`, {
        $ident: ident,
      }, (err, result) => {
        if (err) {
          res({
            status: false,
            result: null,
            error: err.message,
          });
        } else {
          res({
            status: true,
            result,
            error: null,
          });
        }
      });
    });
  }

  checkExistsUserProjects(userName, projectCode) {
    return new Promise((res) => {
      this.db.get(`select count(*) queryResult
                     from D_USERS u
                    where u.USER_ID = $user_name
                      and exists (select 1
                                    from D_USER_PROJECTS up
                                         join D_PROJECTS p
                                   where p.PROJECT_CODE = $project_code
                                     and up.USER = u.ID)`, {
        $user_name: userName,
        $project_code: projectCode,
      }, (err, result) => {
        if (err) {
          res({
            status: false,
            result: null,
            error: err.message,
          });
        } else {
          res({
            status: true,
            result,
            error: null,
          });
        }
      });
    });
  }

  addUser(ident, userName, login) {
    return new Promise((res) => {
      this.db.run(`insert into D_USERS (USER_ID, USER_NAME, USER_LOGIN)
                          values ($ident, $name, $login)`, {
        $ident: ident,
        $name: userName,
        $login: login,
      }, (err) => {
        if (err) {
          res({
            status: false,
            error: err.message,
          });
        } else {
          res({
            status: true,
            error: null,
          });
        }
      });
    });
  }

  getLastUserId() {
    return new Promise((res) => {
      this.db.get(
        `select last_insert_rowid() lastUserId
           from D_USERS`,
        (err, result) => {
          if (err) {
            res({
              status: false,
              result: null,
              error: err.message,
            });
          } else {
            res({
              status: true,
              result,
              error: null,
            });
          }
        },
      );
    });
  }

  addUserProjects(ident, projects) {
    return new Promise((res) => {
      projects.forEach((project) => {
        this.db.run(`insert into D_USER_PROJECTS (USER, PROJECT)
                            select $ident,
                                   p.ID
                              from D_PROJECTS p
                             where p.PROJECT_CODE = $project`, {
          $ident: ident,
          $project: project,
        }, (err) => {
          if (err) {
            res({
              status: false,
              error: err,
            });
          }
        });
      });
      res({
        status: true,
        error: null,
      });
    });
  }

  addUserLog(ident, clientName, taskText, taskResult, taskTime) {
    return new Promise((res) => {
      this.db.run(`insert into D_USER_LOGS (USER, CLIENT, TASK_TEXT, TASK_DATE, RESULT, LOG_TIME)
                        select u.ID,
                               $clientName,
                               $taskText,
                               date(),
                               $taskResult,
                               $taskTime
                          from D_USERS u
                         where u.USER_ID = $ident`, {
        $ident: ident,
        $clientName: clientName,
        $taskText: taskText,
        $taskResult: taskResult,
        $taskTime: taskTime,
      }, (err) => {
        if (err) {
          res({
            status: false,
            error: err.message,
          });
        } else {
          res({
            status: true,
            error: null,
          });
        }
      });
    });
  }

  getProjects() {
    return new Promise((res) => {
      this.db.all(
        `select PROJECT_CODE,
                PROJECT_NAME
           from D_PROJECTS`,
        (err, result) => {
          if (err) {
            res({
              status: false,
              result: null,
              error: err.message,
            });
          } else {
            res({
              status: true,
              result,
              error: null,
            });
          }
        },
      );
    });
  }

  getLogReport(dateIn, dateOut) {
    return new Promise((res) => {
      this.db.all(`select u.USER_NAME,
                          ul.CLIENT,
                          ul.TASK_TEXT,
                          strftime('%d.%m.%Y', ul.TASK_DATE) TASK_DATE,
                          ul.RESULT,
                          ul.LOG_TIME
                     from D_USER_LOGS ul
                          join D_USERS u on ul.USER = u.ID
                    where ul.TASK_DATE between strftime('%Y-%m-%d', $DATE_IN) and strftime('%Y-%m-%d', $DATE_OUT)`, {
        $DATE_IN: dateIn,
        $DATE_OUT: dateOut,
      }, (err, result) => {
        if (err) {
          res({
            status: false,
            result: null,
            error: err.message,
          });
        } else {
          res({
            status: true,
            result,
            error: null,
          });
        }
      });
    });
  }

  getSupervisorReport(data) {
    if (data === 'users') {
      return new Promise((res) => {
        this.db.all(
          `select u.USER_ID,
                  u.USER_NAME,
                  u.USER_LOGIN,
                  group_concat(p.PROJECT_NAME, '; ') AVAILABLE_PROJECTS
             from D_USERS u
                  join D_USER_PROJECTS up on up.USER = u.ID
                  join D_PROJECTS p on up.PROJECT = p.ID
            group by u.USER_ID,
                     u.USER_NAME,
                     u.USER_LOGIN`,
          (err, result) => {
            if (err) {
              res({
                status: false,
                result: null,
                list: null,
                error: err.message,
              });
            } else {
              res({
                status: true,
                result,
                list: 'Пользователи',
                error: null,
              });
            }
          },
        );
      });
    } if (data === 'projects') {
      return new Promise((res) => {
        this.db.all(
          `select PROJECT_CODE,
                  PROJECT_NAME
             from D_PROJECTS`,
          (err, result) => {
            if (err) {
              res({
                status: false,
                result: null,
                list: null,
                error: err.message,
              });
            } else {
              res({
                status: true,
                result,
                list: 'Проекты',
                error: null,
              });
            }
          },
        );
      });
    } if (data === 'logs') {
      return new Promise((res) => {
        this.db.all(
          `select u.USER_NAME,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '01') = '01'
                      and ul1.USER = ul.USER) JANUARY,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '02') = '02'
                      and ul1.USER = ul.USER) FEBRUARY,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '03') = '03'
                      and ul1.USER = ul.USER) MARCH,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '04') = '04'
                      and ul1.USER = ul.USER) APRIL,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '05') = '05'
                      and ul1.USER = ul.USER) MAY,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '06') = '06'
                      and ul1.USER = ul.USER) JUNE,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '07') = '07'
                      and ul1.USER = ul.USER) JULY,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '08') = '08'
                      and ul1.USER = ul.USER) AUGUST,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '09') = '09'
                      and ul1.USER = ul.USER) SEPTEMBER,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '10') = '10'
                      and ul1.USER = ul.USER) OCTOBER,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '11') = '11'
                      and ul1.USER = ul.USER) NOVEMBER,
                  (select sum(ul1.LOG_TIME)
                     from D_USER_LOGS ul1
                    where coalesce(strftime('%m', ul1.TASK_DATE), '12') = '12'
                      and ul1.USER = ul.USER) DECEMBER
             from D_USER_LOGS ul
                  join D_USERS u on ul.USER = u.ID
            where strftime('%Y', ul.TASK_DATE) = strftime('%Y', 'now', 'localtime')
            group by ul.USER`,
          (err, result) => {
            if (err) {
              res({
                status: false,
                result: null,
                list: null,
                error: err.message,
              });
            } else {
              res({
                status: true,
                result,
                list: 'Логирование',
                error: null,
              });
            }
          },
        );
      });
    } if (data === 'vpn_accounts_log') {
      return new Promise((res) => {
        this.db.all(
          `select u.USER_NAME,
                  ova.ACCOUNT,
                  ova.DATE_BEGIN,
                  ova.DATE_END
             from D_OTTA_VPN_ACCOUNTS ova
                  join D_USERS u on ova.USER = u.ID`,
          (err, result) => {
            if (err) {
              res({
                status: false,
                result: null,
                list: null,
                error: err.message,
              });
            } else {
              res({
                status: true,
                result,
                list: 'Учетные записи НИИ Отта',
                error: null,
              });
            }
          },
        );
      });
    }
  }

  checkFreeOttaVpn() {
    return new Promise((res) => {
      this.db.all(
        `select ova.ACCOUNT
           from D_OTTA_VPN_ACCOUNTS ova
                join D_USERS u on ova.USER = u.ID
          where strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') > ova.DATE_BEGIN
            and ova.DATE_END is null`,
        (err, result) => {
          if (err) {
            res({
              status: false,
              result: null,
              error: err.message,
            });
          } else {
            res({
              status: true,
              result,
              error: null,
            });
          }
        },
      );
    });
  }

  checkUserOttaVpn(user) {
    return new Promise((res) => {
      this.db.get(
        `select ova.ID,
                ova.ACCOUNT
           from D_OTTA_VPN_ACCOUNTS ova
                join D_USERS u on ova.USER = u.ID
          where strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') > ova.DATE_BEGIN
            and ova.DATE_END is null
            and u.USER_ID = $user`,
        {
          $user: user,
        },
        (err, result) => {
          if (err) {
            res({
              status: false,
              result: null,
              error: err.message,
            });
          } else {
            res({
              status: true,
              result,
              error: null,
            });
          }
        },
      );
    });
  }

  takeVpnAccount(user, account) {
    return new Promise((res) => {
      this.db.run(`insert into D_OTTA_VPN_ACCOUNTS (USER, ACCOUNT, DATE_BEGIN, DATE_END)
                        select u.ID,
                               $account,
                               strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'),
                               null
                          from D_USERS u
                         where u.USER_ID = $user`, {
        $user: user,
        $account: account,
      }, (err) => {
        if (err) {
          res({
            status: false,
            error: err.message,
          });
        } else {
          res({
            status: true,
            error: null,
          });
        }
      });
    });
  }

  releaseVpnAccount(ident) {
    return new Promise((res) => {
      this.db.run(`update D_OTTA_VPN_ACCOUNTS
                      set DATE_END = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                    where ID = $ident`, {
        $ident: ident,
      }, (err) => {
        if (err) {
          res({
            status: false,
            error: err.message,
          });
        } else {
          res({
            status: true,
            error: null,
          });
        }
      });
    });
  }
}
