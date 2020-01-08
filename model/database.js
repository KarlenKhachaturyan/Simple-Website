const mysql = require('mysql')
let connection  = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : "social_karlen" 
});
connection.connect();


class Model{
    constructor(table){
        this.table = table;
        this.command = "";
        this.takeone = false;
    }
    select(...keys){
        this.takeone = false;
        this.command = `select ${keys.join(',')} from ${this.table}`
        return this;
    }
    findAll(){
        this.takeone = false;

        this.command = `select * from ${this.table}`;
        return this;
    }
    join(table){
        this.command += ` join ${table}`
        return this
    }
    on(key, value){
        this.command = ` on ${key}=${value}`;
        return this;
    }
    insert(data){
        let keys = Object.keys(data).join(',')
        let vals = Object.values(data).join("','")
        this.command = `insert into ${this.table} (${keys}) values  ('${vals}')`
        return this;
    }
    where(key, opp, value = false){
        if(this.command.includes('where')){
            if(value){
                this.command += ` and ${key} ${opp} '${value}'`
            }else{
                this.command += ` and ${key} = '${opp}'`
            }
        }else{
            if(value){
                this.command += ` where ${key} ${opp} '${value}'`
            }else{
                this.command += ` where ${key} = '${opp}'`
            }
        }
        return this;
    }
    
    switchDatabase(db, table){
        connection  = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : '',
            database : db 
        });
        this.table = table;
        connection.connect();

        return this
    }
    rawQuery(command){
        this.command = command
        return this
    }

    first(){
        this.takeone = true;
        return this;
    }
    switchTable(table){
        this.table = table;
        return this;
    }
    async delete(){
        let data = await this.done()
        let command = "";
        if(this.takeone){
            let id = data.id;
             command = `delete from ${this.table} where id =${id}`
            
        }
        return new Promise((resolve,reject)=>{
            connection.query(command, (err,data)=>{
                if(err) reject(err)
                resolve(data)
            })
        })
        
    }

    update(id, obj){
        this.command = `update ${this.table} set `
        for(let key in obj){
            this.command += `${key} = '${obj[key]}',`
        }
        this.command = this.command.substring(0, this.command.length-1)
        this.command+= ` where id  = ${id}`

        return this
    }

    done(){
        return new Promise((resolve,reject)=>{
            connection.query(this.command, (err,data)=>{
                if(err) reject(err);
                if(this.takeone){
                    resolve(data[0])
                    // this.takeone = false;
                }else{
                    resolve(data)
                }
            })
        })
    }
}

module.exports = Model;