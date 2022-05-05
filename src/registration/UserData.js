export default class UserData {
  setIdent(ident) {
    this.ident = ident;
    this.projects = [];
  }

  setName(name) {
    const re = /[,./|^%$#@()*!_+=`~:;<>\da-z]/;
    if (re.exec(name.toLowerCase())) {
      return false;
    }
    this.userName = name;
    return true;
  }

  setLogin(login) {
    const re = /[а-я]/;
    if (re.exec(login.toLowerCase())) {
      return false;
    }
    this.login = login;
    return true;
  }

  setProject(project) {
    if (this.projects.find((item) => item === project)) {
      return false;
    }
    this.projects.push(project);
    return true;
  }

  regContinue() {
    if (this.projects.length === 0) {
      return false;
    }
    return true;
  }
}
