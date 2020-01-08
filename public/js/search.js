new Vue({
    el:"#search",
    data:{
        users:[],
        searchText:"",
        
    },
    methods:{
        searchFriends:function(){
            if(!this.searchText){
                this.users = [];
                return;
            }
           axios.post("/user/search", {text:this.searchText})
           .then(r=>{
               this.users = r.data
               
           })
        },
        addFriend:function(id){
            let obj = this.users.find(y => y.id == id)
            obj.requestSent.push(1)
           axios.post("/addFriend", {id}).then(r=>{
               console.log("OK")
           })
 
        }
    }
})