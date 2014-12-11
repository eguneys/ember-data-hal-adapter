var get = Ember.get, set = Ember.set, hash = Ember.RSVP.hash;

var env, store, adapter;
var Person, Role, Group, Task, Comment, Post;

module("integration/hal-adapter - HALAdapter", {
    setup: function() {
        Person = DS.Model.extend({
            name: DS.attr('string')
        });

        Group = DS.Model.extend({
            name: DS.attr('string'),
            people: DS.hasMany('person')
        });

        Role = DS.Model.extend({
            name: DS.attr('string'),
            primaryKey: '_id'
        });

        Task = DS.Model.extend({
            name: DS.attr('string'),
            owner: DS.belongsTo('person')
        });

        Comment = DS.Model.extend({
            text: DS.attr('string')
        });

        Post = DS.Model.extend({
            text: DS.attr('string'),
            comments: DS.hasMany('comment')
        });

        env = setupStore({
            person: Person,
            group: Group,
            role: Role,
            task: Task,
            comment: Comment,
            post: Post,
            adapter: HAL.Adapter
        });

        store = env.store;
        adapter = env.adapter;
        
        env.store.modelFor('person');
        env.store.modelFor('group');
        env.store.modelFor('role');
        env.store.modelFor('task');

        env.container.register('serializer:application', HAL.Serializer);
        env.container.register('serializer:-hal', HAL.Serializer);
        env.container.register('adapter:-hal', HAL.Adapter);
        env.dtSerializer = env.container.lookup('serializer:-hal');
        env.dtAdapter = env.container.lookup('adapter:-hal');

        passedUrl = passedVerb = passedHash = null;
    }
});

function ajaxResponse(value) {
    adapter.ajax = function(url, verb, hash) {
        passedUrl = url;
        passedVerb = verb;
        passedHash = hash;

        return Ember.RSVP.resolve(value);
    };
}

var expectUrl = function(url, desc) {
    equal(passedUrl, url, "the URL is: " + url);
};


var expectType = function(type) {
    equal(passedVerb, type, "the HTTP method is: " + type);
};

var expectData = function(hash) {
    deepEqual(passedHash.data, hash, "the hash was passed along");
};

var expectState = function(model, state, value) {
    if (value === undefined) { value = true; }

    var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
    equal(get(model, flag), value, "the person is " + (value === false? "not ":"") + state);
};

var expectStates = function(arr, state, value) {
    arr.forEach(function(model) {
        expectState(model, state, value);
    });
};


test("can create record", function() {
    var record = store.createRecord('person');
    set(record, 'name', 'bar');

    equal(get(record, 'name'), 'bar', 'property was set on the record');
});


test("async hasMany backed by a link always returns a promise", function() {
  Post.reopen({ 
    comments: DS.hasMany('comment', { async: true })
  });

  store.push('post', { id: 1, text: "Some text", links: { comments: 'post/1/comments' } });

  store.find('post', 1).then(async(function(post) {
    equal(post.get('text'), "Some text");
    ok(post.get('comments') instanceof DS.PromiseArray, "comments is a promise");
  }));
});
