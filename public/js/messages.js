new Vue({
    el:"#frame",
    data:{
        me:null,
        chatFriends: [],
        currentUser:-1,
        currentUserDetails:null,
        currentMessages:[],
        currentMessage:"",
        chatInterval:null,
        notificationInterval:null
    },
    methods:{
        startChat:function(id){
            this.currentUser = id;
            this.currentUserDetails=this.chatFriends.find(y=>y.id == id)

            clearInterval(this.chatInterval)
            this.chatInterval = setInterval(()=>{
                axios.post('/getChat', {id:  this.currentUser})
                .then(r =>{
                    this.currentMessages = r.data;
                    let obj = this.chatFriends.find(y => y.id == id)
                    obj.newMessage= false;
                })
            },1000)
          
        },
        sendMessage:function(data){
            axios.post('/sendMessage', {to_id:this.currentUser, text: this.currentMessage})
            .then(r=>{
                this.currentMessage =''
                this.startChat(this.currentUser) 
            })
        },
        send:function(e){
            console.log(e.key)
            if(e.key == 'Enter'){
                this.sendMessage()
            }
        }
    },  
    created:function(){
            axios.get('/chatFriends').then(r=>{
                this.chatFriends = r.data;
            })

            axios.get('/getUser').then(r =>{
                this.me = r.data
            })

            clearInterval(this.notificationInterval)
            this.notificationInterval = setInterval(()=>{
                axios.get('/checkChat')
                .then(r =>{
                   r.data.map(item => {
                       let index = this.chatFriends.findIndex(y=> y.id == item.from_id)
                       this.chatFriends[index].newMessage=true;
                       
                   })
                })
            },1000)
    
    }
})
