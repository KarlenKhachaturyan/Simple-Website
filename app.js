const express = require('express');
const app = express();
const Model = require('./model/database');
const Hash = require("./lib/hasher")

var   session = require('express-session')
      app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 6000000000000 }}))
      
      app.set("views", "pages")
      app.set("view engine", "ejs")
      app.use(express.static("public"))

////////////////////////////////////////picture uploader///////////////////
const multer = require("multer")
var   storage = multer.diskStorage({
                destination: function (req, file, cb) {
                  cb(null, 'public/images')
                },
                filename: function (req, file, cb) {
                  cb(null, file.fieldname + '-' + Date.now()+file.originalname)
                }
})
 
var   upload = multer({ storage: storage })
/////////////////////////////////////////////////////////////
let   currentUser = null;
let   otherUser = null;
let   error = "";

const bodyParser = require("body-parser")

      app.use(bodyParser.urlencoded({extended: false}))
      app.use(bodyParser.json())

///////////////////////////////////////// HOME //////////////////// 
      app.get("/", (req, res) => {
          res.render("home", {
            error
          })
          error = "";
        })
/////////////////////////////////////////// Register //////////////////////////////
    app.post("/addNewUser", (req, res) => {
      for(let key in req.body){
          if(!req.body[key]){
          error = "Please Fill All The Fields!"
          }
        }
          if (req.body.password_confirm !== req.body.password) {
              error = "Your password's don't match"
              return res.redirect("/")
              }
            
          delete req.body.password_confirm;

    let  model = new Model('users'); 
         Hash.hash(req.body.password)
             .then(r=>{
                 req.body.password = r;
                 return model.insert(req.body).done()
               })        
             .then(r => {
                 error = ''
                 res.redirect("/profile")
               })
            .catch(err=>{
                 console.log(err)
               })
})        
////////////////////////////////////// Login ////////////////////
    app.get('/login', (req, res)=>{    
        res.render('login', {error:req.session.error});
        req.session.destroy()
        error ="";
  })

    app.post("/tryLogin", (req,res)=>{
    let error = ""
    let model = new Model("users")
        model.select("*")
            .where("login", req.body.login)
            .done()
            .then(r=>{
              if(!r.length){
                  req.session.error= 'Please Enter a Valid Login'
                  return res.redirect("/login")
              }else{
                r=r[0];
                req.session.user = r;               
                return Hash.compare(req.body.password, r.password)
              }
            })
            .then(r=>{
                if(!r){
                    currentUser = null;
                    error = "Password is wrong!"
                    return model.rawQuery(`select login_attempt from users                    
                                          where login = '${req.body.login}'`)
                                          .done()

                }
                else if(req.session.user){
                  let now = Date.now()/1000
                  let then = req.session.user.time;
                  let difference = now-then
                  if(difference>0 && difference<60){
                    req.session.error = "You are blocked!"
                    return Promise.reject({error:true})
                  }else{
                    return Promise.resolve({success:true})
                  }
                }
                else{
                  return Promise.resolve({success:true})
                }
                
              })
              .then(r=>{
                if("success" in r){
                  model.rawQuery(`update users 
                                  set login_attempt = 0, time = ''
                                  where login = '${req.body.login}'`)
                      .done()
                  return res.redirect("/profile")
                }
                r=r[0]
                if(r.login_attempt<2){
                  return model.rawQuery(`update users 
                                    set login_attempt = login_attempt+1
                                    where login = '${req.body.login}'`) 
                         .done()
                }else{
                  if(r.login_attempt==2){
                          model.rawQuery(`update users 
                                set login_attempt = login_attempt+1, time='${Date.now()/1000}'
                                where login = '${req.body.login}'`) 
                          .done()
                          return Promise.resolve({block:"true"})
                  }
                 
                }

              })
              .then(r=>{
                if("block" in r){
                  req.session.error="You are blocked for 5 mins"
                  return res.redirect("/login")
                }else{
                  req.session.error = "Password is wrong"
                  return res.redirect("/login")

                }
              })
            .catch(()=>{
              return res.redirect("/login")
            })
    })

///////////////////////////////////// LogOut //////////////////////////
     app.get("/logout", (req,res)=>{
      currentUser = null;
      return res.redirect("/login");
})

//////////////////////////////////////////// Profile /////////////////////
  app.get('/profile', (req, res) => {
      if(!req.session.user){
      error = "Please login before accessing..."
      return res.redirect("/login")
      }
      res.render('profile', {currentUser:req.session.user})
})
/////////////////////
app.post("/addFriend", (req,res)=>{

  let model = new Model("requests")
  model.insert({from_id:req.session.user.id, to_id:req.body.id})
       .done()
       .then(r=>{
         res.send("OK")
       })
       .catch(err=>console.log(err.message))
})
////////////////////////
  app.post("/updatePic", upload.single("avatar"), (req,res)=>{
  let model = new Model("users")
      model.update(currentUser.id, {photo: "images/" + req.file.filename})
           .done()
           .then(r=>{
                 currentUser.photo = "images/"+req.file.filename
                 res.redirect("/profile")
  })
})
///////////////////////////
app.post("/user/search", (req,res)=>{
  let model = new Model("users")
      model.select("*")
           .where("name", "like", `${req.body.text}%`)
           .done()
           .then( async (r)=>{
                for(let i = 0; i < r.length; i++){
                  let model2 = new Model("requests")
                  let friendsModel = new Model("friends")

                  r[i].requestSent = await model2.select("*")
                                                  .where("from_id", req.session.user.id)
                                                  .where("to_id", r[i].id)
                                                  .done()

                  r[i].areWeFriends = await friendsModel.rawQuery(`select * from friends where user_id = ${req.session.user.id} 
                                                                   and friend_id = ${r[i].id}
                                                                   union
                                                                   select * from friends where friend_id = ${req.session.user.id} 
                                                                   and user_id = ${r[i].id}`)
                                                        .done()
                  r[i].url = `/user/profile/${r[i].id}`                                  
                }
                 res.send(r)
            })
})
//////////////////////////// post
app.post('/addNewPost',upload.single("avatar"), (req, res)=>{
  let pModel = new Model('posts')
  pModel.insert({picture: "images/"+ req.file.filename, user_id:req.session.user.id, content: req.body.desc})
        .done()
        .then(r => {
          res.redirect('/profile')
        })
  
})
//////////////////////////////
app.get("/getPosts", (req,res)=>{
  let getPostsModel =  new Model('posts')
      getPostsModel.select('*')
                    .where('user_id', req.session.user.id)
                    .done()
                    .then( async (r)=> {
                      let likesModel = new Model("likes")
                      for(let i = 0; i < r.length; i++){
                        r[i].likes = await likesModel
                                          .rawQuery(`select * from users where id in
                                                    (select user_id from likes where post_id=${r[i].id})            
                                          `).done()                          
                      }
                      res.send(r)
                    })
})

////////////////////////////////
app.post('/likePost', (req, res)=>{

  let likedPosts = new Model('likes')
      likedPosts.insert({user_id:req.session.user.id,post_id:req.body.id})
                .done()
                .then(r=>{
                  res.send("OK")
                })
})
///////////////////////////
app.post('/disliked', (req, res) => {
   let dislikeModal = new Model('likes')

        dislikeModal.select('*')
                    .where('post_id', req.body.id)
                    .where('user_id', req.session.user.id)
                    .first()
                    .delete()
                    .then(r => {
                      res.send(r)
                    })
})
/////////////////////////////
app.post('/wholiked', (req, res)=>{
    
    let wholiked = new Model('likes')
        wholiked.rawQuery(`SELECT * from likes join users on likes.user_id = users.id`)
        .where('post_id', req.body.id)
        .done()
        .then(r =>{
          res.send(r)
        })
     
})
///////////////////////////
app.post('/addComment', (req, res)=>{
      
      let commentModel = new Model('comments')
        commentModel.insert({post_id: req.body.post, user_id: req.session.user.id, description: req.body.data})
                    .done()
                    .then(r=>{
                     res.send(r)
                    })
})

app.post('/showComments', (req, res) =>{
      let showCommentModel = new Model('comments');
          showCommentModel.rawQuery(`select * from comments 
                                    join users on comments.user_id = users.id 
                                    where post_id = ${req.body.data}`)
                          .done()
                          .then(r=>{
                            res.send(r)
                          })
                          .catch(err=>res.send(err.message))

})


////////////////////////////////////////////////////otherUsersPage
app.get("/user/profile/:id", (req,res)=>{
  if(!req.session.user){
    return res.redirect("/login")
  }
   let id = req.params.id;
    req.session.otherUser = id;
    res.render('otherPage')    
})
app.get('/getOtherUserPosts', (req, res)=>{
      let id = req.session.otherUser
      let data = {posts:[], user:null}
      let getOtherPostModel = new Model('posts')
          getOtherPostModel.select('*')
                          .where('user_id', id)
                          .done()
                          .then( async (r) =>{
                           data.posts = r;
                           
                           let likesModel = new Model("likes")
                           for(let i = 0; i < data.posts.length; i++){
                             data.posts[i].likes = await likesModel.select("*")
                                                                  .where("post_id", data.posts[i].id)
                                                                  .done()

                           }
                           let userModel = new Model("users")
                           return userModel.select("*").where("id", id).done()
                          })
                          .then(r=>{
                            data.user = r;
                            data.me = req.session.user.id

                            res.send(data)
                          })
                          .catch(err=>res.send(err.message))
})
///////////////////////////////////////////////////////////////////// Messsenger

app.get('/messages', (req, res)=>{
  if(!req.session.user){
    return res.redirect("/login")
  }
  res.render('messages', {user: req.session.user.id})
})

app.get("/chatFriends", (req, res)=>{
  if(!req.session.user){
    return res.redirect("/login")
  }
      let chatFriendsModel = new Model('friends')
        chatFriendsModel.rawQuery(`select * from users where id in (
                                   SELECT friend_id from friends where user_id = ${req.session.user.id}
                                   union 
                                   SELECT user_id from friends where friend_id = ${req.session.user.id})`)
                        .done() 
                        .then(async (r) =>{
                          r.map(item=>{
                            item.newMessage = "false";
                            return item;
                          })
                          for(let i = 0; i< r.length; i++){
                            let messageModel = new Model('messages')

                            r[i].lastMsg = await messageModel.rawQuery(` select text from messages 
                                                                    where (from_id = ${r[i].id}
                                                                    and to_id = ${req.session.user.id})
                                                                    or (from_id = ${req.session.user.id}
                                                                      and to_id = ${r[i].id})
                                                                    order by id desc
                                                                    limit 1
                              `)
                              .done()
                          }
                            res.send(r)
                        })
})

app.get('/getUser', (req, res) =>{
  let me = req.session.user
  res.send(me)
})

app.get('/checkChat', (req, res)=>{
      let checkModel = new Model('messages')
      checkModel.select('*')
                .where('status', 0)
                .where('to_id', req.session.user.id)
                .done()
                .then(r =>{
                  res.send(r)
                })
})

app.post('/getChat', (req, res) =>{
    let getChatModel = new Model('messages')

    let updateChat = new Model('messages')
    updateChat.rawQuery(`update messages 
                         set status = 1
                         where to_id = ${req.session.user.id} and from_id = ${req.body.id}`)
              .done()
              .then(r=>{
                 return  getChatModel.rawQuery(`select * from messages where from_id = ${req.session.user.id} and to_id = ${req.body.id}
                                union
                                SELECT * from messages where to_id = ${req.session.user.id} and from_id = ${req.body.id}
                                order by time`)
                      .done()
              })
              .then(r =>{
                      res.send(r)
              })
            .catch(err=>console.log(err.message))
})

app.post('/sendMessage', (req, res) =>{
      let sendMessageModel = new Model('messages')
          sendMessageModel.insert({to_id: req.body.to_id, from_id: req.session.user.id, text: req.body.text, time:Date.now(), status:0})
                          .done()
                          .then(r =>{
                            res.send(r)
                          })
})

///////////////////////////////////////// Friends ///////////////////////////
  app.get('/friends', (req, res)=>{
    if(!req.session.user){
      return res.redirect('/login')
    }
    res.render('friends')
  })

  app.get('/getFriends', (req, res)=>{
    let friends = new Model('friends')
        friends.rawQuery(`select * from users where id in (
                        SELECT friend_id from friends where user_id = ${req.session.user.id}
                        union 
                        SELECT user_id from friends where friend_id = ${req.session.user.id})`)
               .done() 
               .then(r =>{
                  res.send(r)
                  
               })
  })

  app.post("/deleteFromFriends", (req,res)=>{
    let id = req.body.id;
    let dModel = new Model('friends')
        dModel.rawQuery(`delete from friends where
                          (friend_id = ${id} and user_id=${req.session.user.id})
                           or (friend_id = ${req.session.user.id} and user_id=${id})`)
        .done()
        .then(r=>{
          res.send("OK")
        })
  })

///////////////////////////////////////// Friends-requests //////////////////
  app.get('/requests', (req, res) =>{ 
    if(!req.session.user){
      return res.redirect("/login")
    }
        res.render('requests')
})

  app.get('/getRequests', (req, res)=>{
      let requests = new Model('requests')
          requests.rawQuery(`select * from users where id in(
                              select from_id from requests where to_id = ${req.session.user.id}
                            )`)
                  .done()
                  .then(r => {
                    res.send(r)
                  })
  })

  app.post('/accept', (req, res)=>{
    let accModel = new Model('requests')
        accModel.select('*')
                .where('from_id', req.body.id)
                .where('to_id', req.session.user.id)
                .first()
                .delete()
                .then(r=>{
                   return  accModel.switchTable('friends')
                            .insert({user_id:req.session.user.id, friend_id: req.body.id})
                            .done()
                })
                .then(r=>{
                  res.send("OK")
                })
                .catch(err=>console.log(err.message))
  })


  app.post('/deny', (req, res)=>{
    let rModel = new Model('requests')
    rModel.select('*')
            .where('from_id', req.body.id)
            .where('to_id', req.session.user.id)
            .first()
            .delete()
            .then(r =>{
              res.send('ok')
            })
  })

///////////////////////////////////// Settings ///////////////////////////
app.get('/settings',(req, res) =>{
  if(!req.session.user){
      error = ' Please Log In for this option'
      return res.redirect('/login')
  }
  res.render('settings', {currentUser, error})
  error ="";
})

app.post('/changePass', (req, res) => {
  if(!req.body.oldPass || !req.body.newPass || !req.body.newPassConf){
    error = 'Please fill all the fields';
    return res.redirect("/settings");
  }else if(req.body.newPass != req.body.newPassConf){
    error = "Passwords aren't match!"
    return res.redirect("/settings");
  }

Hash.compare(req.body.oldPass, currentUser.password)
    .then(r=>{
        return Hash.hash(req.body.newPass)         
      })
    .then(r=>{
      let model = new Model("users")
      return model.update(currentUser.id, {password:r}).done()
      })
    .then(r=>{
       return res.redirect("/profile")
      })
    .catch(err=>console.log(err.message))
})

  app.listen(4200)
     console.log("... Server Started")