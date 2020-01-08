var bcrypt = require('bcryptjs');

class Hasher{
    static hash(password){  
        return new Promise((resolve,reject)=>{
           bcrypt.hash(password,10,(err,data)=>{
               if(err) reject(err)
               resolve(data)
           })
        })

    }

    static compare(original, hash){
        return new Promise((resolve,reject)=>{
            bcrypt.compare(original, hash, (err, data)=>{
                if(err) reject(err)
                
                resolve(data)
            })
        })
    }
}

module.exports = Hasher