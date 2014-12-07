var get = Ember.get, set = Ember.set;
var HomePlanet, league, SuperVillain, superVillain, EvilMinion, YellowMinion, DoomsdayDevice, PopularVillain, Commment, Course, Unit, env;

module("integration/hal_adapter - HALSerializer", {
  setup: function() {
    SuperVillain = DS.Model.extend({
      firstName: DS.attr('string'),
      lastName: DS.attr('string'),
      homePlanet: DS.belongsTo('homePlanet', {async: true}),
      evilMinions: DS.hasMany("evilMinion", {async: true})
    });
    HomePlanet = DS.Model.extend({
      name: DS.attr('string'),
      villains: DS.hasMany('superVillain', {async:true})
    });
    EvilMinion = DS.Model.extend({
      superVillain: DS.belongsTo('superVillain'),
      name: DS.attr('string')
    });
    YellowMinion = EvilMinion.extend();
    DoomsdayDevice = DS.Model.extend({
      name: DS.attr('string'),
      evilMinion: DS.belongsTo('evilMinion', {polymorphic:true})
    });
    PopularVillain = DS.Model.extend({
      name: DS.attr('string'),
      evilMinions: DS.hasMany('evilMinion', {polymorphic:true})
    });
    Comment = DS.Model.extend({
      body: DS.attr('string'),
      root: DS.attr('boolean'),
      children: DS.hasMany('comment')
    });
    Course = DS.Model.extend({
      name: DS.attr('string'),
      prerequisiteUnits: DS.hasMany('unit'),
      units: DS.hasMany('unit')
    });
    Unit = DS.Model.extend({
      name: DS.attr('string')
    });
    env = setupStore({
      superVillain: SuperVillain,
      homePlanet: HomePlanet,
      evilMinion: EvilMinion,
      yellowMinion: YellowMinion,
      doomsdayDevice: DoomsdayDevice,
      popularVillain: PopularVillain,
      comment: Comment,
      course: Course,
      unit: Unit,
      adapter: HAL.Adapter
    });

    env.store.modelFor('superVillain');
    env.store.modelFor('homePlanet');
    env.store.modelFor('evilMinion');
    env.store.modelFor('yellowMinion');
    env.store.modelFor('doomsdayDevice');
    env.store.modelFor('popularVillain');
    env.store.modelFor('comment');
    env.store.modelFor('course');
    env.store.modelFor('unit');

    env.container.register('serializer:application', HAL.Serializer);
    env.container.register('serializer:-hal', HAL.Serializer);
    env.container.register('adapter:-hal', HAL.Adapter);

    env.dtSerializer = env.container.lookup("serializer:-hal");
    env.dtAdapter = env.container.lookup("adapter:-hal");
  },

  teardown: function() {
    Ember.run(function() {
      env.store.destroy();
    });
  }
});

test("normalize", function() {
  var superVillain_hash = { 
    _links: {
      self: {
        href: '/superVillains/1'
      },
      home_planet: {
        "href": "/homePlanets/123"
      },
      evil_minions: {
        "href": "/superVillains/1/evilMinions"
      }
    },
    first_name: "Tom", 
    last_name: "Dale"
  };

  var json = env.dtSerializer.normalize(SuperVillain, superVillain_hash, "superVillain");

  deepEqual(json, {
    id: "1",
    firstName: "Tom",
    lastName: "Dale",
    homePlanet: "123",
    evilMinions: "/superVillains/1/evilMinions"
  });
});

test("extractSingle", function() {
  env.container.register('adapter:superVillain', HAL.Adapter);

  var json_hash = {
    _links: {
      self: {
        href: "/homePlanet/1"
      },
      villains: {
        href: "/homePlanet/1/superVillains"
      }
    },
    name: "Umber"
  };

  var json = env.dtSerializer.extractSingle(env.store, HomePlanet, json_hash);

  deepEqual(json, {
    "id": "1",
    "name": "Umber",
    "villains": "/homePlanet/1/superVillains"
  });
});

test("extractArray", function() {
  env.container.register('adapter:superVillain', HAL.Adapter);

  var json_hash = {
    _links: {
      self: {
        href: "/homePlanets"
      }
    },
    _embedded: {
      home_planets: [
        {
          _links: {
            self: {
              href: "/homePlanets/1"
            }
          },
          name: 'Umber',
          villains: [
            { href: "/superVillains/1" },
            { href: "/superVillains/2" }
          ]
        }
      ]
    }
  };

  var array = env.dtSerializer.extractArray(env.store, HomePlanet, json_hash);

  deepEqual(array, [{
    "id": "1",
    "name": "Umber",
    "villains": ["1","2"]
  }]);
});
