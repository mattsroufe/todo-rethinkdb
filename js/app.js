_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var Post = Backbone.Model.extend({});

var Posts = Backbone.Collection.extend({
  model: Post,
  initialize: function () {
    var collection = this;
    this.eventSource = new EventSource(this.url);
    this.eventSource.addEventListener('init', function (event) {
      collection.reset(JSON.parse(event.data));
    }, false);
    this.eventSource.onmessage = function (event) {
      var data = JSON.parse(event.data);
      if ( data.new_val === null ) {
        collection.remove(data.old_val);
      } else {
        collection.add(data.new_val, {merge: true});
      }
    };
  },
  url: '/posts'
});

var PostListView = Backbone.View.extend({
  tagName: 'li',
  template: _.template('<a href="/posts/{{id}}">{{title}}</a>'),
  initialize: function () {
    this.listenTo(this.model, 'change', this.render)
    this.listenTo(this.model, 'remove', this.remove)
  },
  render: function () {
    this.el.innerHTML = this.template(this.model.toJSON());
    return this;
  },
  events: {
    'click a': 'handleClick'
  },
  handleClick: function (e) {
    e.preventDefault();
    postRouter.navigate($(e.currentTarget).attr('href'), {trigger: true});
  }
});

var PostsListView = Backbone.View.extend({
  template: _.template('<h1>My Blog</h1><ul></ul>'),
  initialize: function () {
    this.listenTo(this.collection, 'reset', this.render);
    this.listenTo(this.collection, 'add', this.renderPost);
  },
  render: function () {
    this.el.innerHTML = this.template();
    this.collection.each(function (post) {
      this.renderPost(post);
    }, this);
    return this;
  },
  renderPost: function (post) {
    var ul = this.$el.find('ul');
    ul.append(new PostListView({
      model: post
    }).render().el);
  }
});

var PostRouter = Backbone.Router.extend({
  initialize: function (options) {
    this.posts = options.posts;
    this.main = options.main;
  },
  routes: {
    ''          : 'index',
    'posts/new' : 'newPost',
    'posts/:id' : 'singlePost'
  },
  index: function () {
    if( !this.PostsListView ) {
      this.PostsListView = new PostsListView({collection: this.posts});
    } else {
      this.PostsListView.render();
    }
    this.main.html(this.PostsListView.render().el);
  },
  singlePost: function (id) {
    var post = this.posts.get(id);
    var pv = new PostView({
      model: post
    });
    this.main.html(pv.render().el);
  },
  newPost: function () {
    var pfv = new PostFormView({
      posts: this.posts
    });
    this.main.html(pfv.render().el);
  }
});

var PostView = Backbone.View.extend({
  template: _.template($('#postView').html()),
  events: {
    'click a': 'handleClick'
  },
  initialize: function () {
    this.listenTo(this.model, 'change', this.render)
    this.listenTo(this.model, 'remove', this.remove)
  },
  render: function () {
    var model = this.model.toJSON();
    model.pubDate = new Date(Date.parse(model.pubDate)).toDateString();
    this.el.innerHTML = this.template(model);
    return this;
  },
  handleClick: function (e) {
    e.preventDefault();
    postRouter.navigate($(e.currentTarget).attr('href'), {trigger: true});
    return false;
  }
});

var PostFormView = Backbone.View.extend({
  tagName: 'form',
  template: _.template($('#postFormView').html()),
  initialize: function (options) {
    this.posts = options.posts;
  },
  events: {
    'click button': 'createPost'
  },
  render: function () {
    this.el.innerHTML = this.template();
    return this;
  },
  createPost: function (e) {
    var postAttrs = {
      content: $('#postText').val(),
      title: $('#postTitle').val(),
      pubDate: new Date()
    };
    this.posts.create(postAttrs);
    postRouter.navigate("/", {trigger: true});
    return false;
  }
})

var Comment = Backbone.Model.extend({});
var Comments = Backbone.Collection.extend({
  initialize: function (models, options) {
    this.post = options.post;
  },
  url: function () {
    return this.post.url() + '/comments';
  }
});
