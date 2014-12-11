export default DS.RESTSerializer.extend({
  
  keyForAttribute: function(attr) {
    return Ember.String.decamelize(attr);
  },

  keyForRelationship: function(key, type) {
    return Ember.String.decamelize(key);
  },
  
  extractSingle: function(store, primaryType, payload, recordId, requestType) {
    var primaryTypeName;

    if (this.keyForAttribute) {
      primaryTypeName = this.keyForAttribute(primaryType.typeKey);
    } else {
      primaryTypeName = primaryType.typeKey;
    }

    var newPayload = {};
    newPayload[primaryTypeName] = {};
    
    for (var key in payload) {
      if (key === '_embedded') {
        newPayload[key] = payload[key];
      } else {
        newPayload[primaryTypeName][key] = payload[key];
      }
    }

    return this._super(store, primaryType, newPayload, recordId, requestType);
  },
  
  normalizePayload: function(payload) {
    if (payload._embedded) {
      for (var key in payload._embedded) {
        if (!Ember.isArray(payload._embedded[key])) {
          payload[key] = [payload._embedded[key]];
        } else {
          payload[key] = payload._embedded[key];
        }
      }
      delete payload._embedded;
    }
    
    if (payload._links) {
      delete payload._links;
    }

    return payload;
  },
  
  normalize: function(type, hash, prop) {
    var json = {};

    for (var key in hash) {
      if (key !== '_links') {
        json[key] = hash[key];
      } else if (typeof hash[key] === 'object') {
        for (var link in hash[key]) {
          var linkValue = hash[key][link];
          if (linkValue && typeof linkValue === 'object' && linkValue.href) {

            json[link] = linkValue.href;
          
          } else {
            json[link] = linkValue;
          }
        }
      }      
    }
    
    return this._super(type, json, prop);
  },

  resourceUriToId: function(link) {
    return link.split('/').reverse()[0];
  },

  normalizeId: function(hash) {
    if (hash.self) {
      hash.id = this.resourceUriToId(hash.self);
      delete hash.self;
    }
  },

  normalizeRelationships: function(type, hash) {
    var payloadKey, key, self = this;

    type.eachRelationship(function(key, relationship) {
      if (this.keyForRelationship) {
        payloadKey = this.keyForRelationship(key, relationship.kind);
        
        if (key != payloadKey) {
          hash[key] = hash[payloadKey];
          delete hash[payloadKey];
        }
      }

      if (hash[key]) {
        if (relationship.kind === 'belongsTo') {
          var resourceUri = hash[key];
          hash[key] = self.resourceUriToId(resourceUri);
        } else if (relationship.kind === 'hasMany') {
          resourceUri = hash[key];
          if (typeof resourceUri === "string") {
            hash.links = hash.links || {};
            hash.links[key] = resourceUri;
            delete hash[key];
          } else  {
            var ids = [];
            hash[key].forEach(function (resourceUri) {
              ids.push(self.resourceUriToId(resourceUri.href));
            });
            hash[key] = ids;
          }
        }
      }
    }, this);
  },

  _normalize: function(type, hash, property) {
    for (var prop in hash) {
      if (prop == '_links' ||
          prop == '_embedded' ||
          prop.indexOf('http') === 0) {
        continue;
      }

      var camelizedProp = Ember.String.camelize(prop);
      if (prop != camelizedProp)
      {
        hash[camelizedProp] = hash[prop];
        delete hash[prop];
      }
    }

    return this._super(type, hash, property);
  },

  _normalizePayload: function(type, payload) {
    var normalizedPayload;

    if (type) {
      normalizedPayload = this._normalizeRootResource(type.typeKey, payload);
    } else {
      normalizedPayload = payload;
    }

    var embeddedResources     = this._extractEmbeddedResources(payload);
    var flatEmbeddedResources = this._flattenRelations(embeddedResources);
    var merged = _.extend(normalizedPayload, flatEmbeddedResources);
    var normalizedEmbeddedResources = this._normalizeEmbeddedIds(merged);

    return normalizedEmbeddedResources;
  },

  _normalizeId: function(hash) {
    hash.id = hash._links.self.href;

    return hash;
  },

  _normalizeRootResource: function(typeKey, payload) {
    var resource = {};
    resource[typeKey] = payload;

    return resource;
  },

  _normalizeEmbeddedIds: function(payload) {
    var serializerScope = this;

    _.each(payload, function(resources, relation) {
      var ids = _.map(resources, function(resource) {
        if (!resource.hasOwnProperty("_embedded")) return resource;
        
        var ids = _.map(resource._embedded, function(embedded, relation) {
          if (!_.isArray(embedded)) embedded = [embedded];
          var mapped = {};

          var mappedIds = _.map(embedded, serializerScope._extractResourceId);
          mapped[relation] = mappedIds;

          return mapped;
        });
        var reduced = _.reduce(ids, function(a,b) { return _.merge(a,b) }, {});

        _.extend(resource, reduced);
      });
    });

    return payload;
  },

  _flattenRelations: function(relations) {
    var flattened = {};

    _.each(relations, function(embeds) {
      _.each(embeds, function(relation_embeds, relation) {
        flattened[relation] = (flattened[relation] || []).concat(relation_embeds);
      })
    })

    return flattened;
  },

  _extractEmbeddedResources: function(payload) {
    return _.walk.pluckRec(payload, "_embedded");
  },

  _extractResourceId: function(payload) {
    var self_link = payload._links.self.href;

    return self_link;
  }
});
