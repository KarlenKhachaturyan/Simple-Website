new Vue({
    el:"#friends",
    data:{
        friends: []
    },
    methods:{
        view:function(id){ 
            axios.post('/openProfile', {id})
                 .then(r =>{
                     return r
                 })
        },
        remove:function(obj){
            let index = this.friends.findIndex(y=>y==obj)
            axios.post('/deleteFromFriends', {id:obj.id})
                 .then(r=>{
                     this.friends.splice(index,1)
                 })
        },
    },  
    created:function(){
        axios.get('/getFriends').then(r=>{
                 this.friends = r.data;
             })
    }
})