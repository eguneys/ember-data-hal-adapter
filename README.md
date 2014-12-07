# Ember Data HAL Adapter

[![Code Climate](https://codeclimate.com/github/locks/ember-data-hal-adapter.png)](https://codeclimate.com/github/locks/ember-data-hal-adapter)
[![Gitter chat](https://badges.gitter.im/locks/ember-data-hal-adapter.png)](https://gitter.im/locks/ember-data-hal-adapter)

## What

A couple months back I started developing an Ember application that was driven by an hypermedia API using the [`application/hal+json`][1] media type.
Given the lack of adapter I set out to build my own, and herein lies the result.

It isn't exactly general at the moment, since I'm only using it in this one project, so please try it out and leave me some feedback on how to improve it.

## How

### Bower

* `bower install ember-data-hal-adapter`

### Ember CLI

* `npm install --save-dev ember-data-hal-adapter`

### Git

* Clone repo with `git clone https://github.com/locks/ember-data-hal-adapter.git`
* Install dependencies with `npm install && bower install`
* Build the library with `broccoli build dist`
* Use the version in `/dist` more suitable for your project

[1]: http://tools.ietf.org/html/draft-kelly-json-hal-06
