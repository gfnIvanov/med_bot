class UserData {
    constructor() {
        this.ident;
        this.userName;
        this.login;
        this.projects = [];
    }

    setIdent = ident => {
        this.ident = ident;
    }

    setName = name => {
        const re = /[,./|^%$#@()*!_+=`~:;<>\da-z]/;
        if(re.exec(name.toLowerCase())) {
            return false;
        } 
        this.userName = name;
        return true;
    }

    setLogin = login => {
        const re = /[а-я]/;
        if(re.exec(login.toLowerCase())) {
            return false;
        } 
        this.login = login;
        return true;
    }

    setProject = project => {
        if (this.projects.find(item => item === project)) {
            return false;
        } else {
            this.projects.push(project);
            return true;
        }
    }
    
    regContinue = () => {
        if (this.projects.length === 0) {
            return false;
        } else {
            return true;
        }
    }
}

module.exports = UserData;