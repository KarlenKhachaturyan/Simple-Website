new Vue({
    el:"#posts",
    data:{
        posts:[],
        likedUsers: [],
        comments: [],
        comment:"",
        currentPost:null
    },
    methods:{
        userLike:function(id){
          axios.post('/wholiked', {id: id})
                .then(r =>{
                    this.likedUsers = r.data
                })
        },
        submitComment:function(){
            axios.post('/addComment', {data: this.comment, post: this.currentPost})
                .then(r=>{
                    this.comment = "";
                    this.viewPhoto(this.currentPost)

                })
        },
        viewPhoto:function(id){

            
            this.currentPost = id;
            axios.post('/showComments', {data:this.currentPost})
            .then(r => {
                console.log(r)
                this.comments = r.data
            })
        }

    },
    created:function(){
        axios.get('/getPosts')
             .then(r=>{
                 this.posts = r.data;
             })
    }
})