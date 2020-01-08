new Vue({
    el:"#posts2",
    data:{
        otherPosts:[],
        user:{},
        me:-1
    },
    methods:{
        liked:function(id){
          
            axios.post('/likePost', {id})
                .then(r=>{
                    let post = this.otherPosts.find(y=>y.id == id)
                    post.iHaveLiked=true;
                    post.likes.push({post_id:id, user_id:this.me})
                    console.log(this.otherPosts)

                })
        },
        dislike:function(id){
           
            axios.post('/disliked', {id})
                .then(r =>{ 
                    let post = this.otherPosts.find(y=>y.id == id)
                     post.iHaveLiked=false;
                     let index = this.otherPosts.indexOf(post)
                     this.otherPosts[index].likes.splice(index, 1)

                })
        },
        submitComment:function(data){
            axios.post('/addComment', {data: data, picture: this.clickedPhoto})
                .then(r=>{
                    return r
                })
        },
        viewPhoto:function(id){
            this.clickedPhoto = id;

            axios.get('/showComments', {id})
            .then(r => {
                console.log(r)
                this.comments = r.data
            })
        }
    },
    created:function(){
        axios.get('/getOtherUserPosts')
             .then(r=>{
                 if(r.data.user){
                    this.user = r.data.user[0];
                    this.otherPosts = r.data.posts;
                    
                    this.me = r.data.me;

                    this.otherPosts.map(item=>{
                        if(item.likes.find(y=>y.user_id == this.me)){
                            item.iHaveLiked=true;
                        }else{
                            item.iHaveLiked = false;
                        }
                    })

                    console.log(this.otherPosts)
                 }
                
             })
    }
})