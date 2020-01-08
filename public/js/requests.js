new Vue({
    el:"#requests",
    data:{
        requests:[]
    },
    methods:{
        accept:function(id){
            let obj = this.requests.find(y=>y.id == id)
            let index = this.requests.indexOf(obj)
            axios.post('/accept', {id}).then(r=>{
                this.requests.splice(index,1)
            })
        },
        deny:function(id){
            let obj = this.requests.find(y=>y.id == id)
            let index = this.requests.indexOf(obj)
           
            axios.post('/deny', {id}).then(r=>{
                this.requests.splice(index,1)
            })
        }
    },
    created:function(){
       axios.get('/getRequests').then(r =>{
           this.requests = r.data
       })

    }
})