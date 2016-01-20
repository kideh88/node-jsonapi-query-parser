# node-jsonapi-query-parser

JsonApiQueryParser class to parse endpoint and its query string parameters to a usable request object.

To be used for ES6 node projects that make use of [JSON API](http://jsonapi.org/)


## Installation

```sh
$ npm install jsonapi-query-parser
```

## Usage

Require the module 'JsonApiQueryParser' into your application and use the 'parseRequest' function to convert the request.url to an easy
usable requestData object.

```js
let JsonApiQueryParser = require('JsonApiQueryParser');

http.createServer(function (request, response) {
  let requestData = JsonApiQueryParser.parseRequest(request.url);

  // .. Do stuff with your requestData object

}).listen(1337, '127.0.0.1');
```

## Return data information (requestData)

The object returned by the JsonApiQueryParser.parseRequest will always be the same structure.
Below you can see 2 parsed examples:

```js
//EXAMPLE 1
let url = '/article/5/relationships/comment'
let requestData = {
  resourceType: 'article',
  identifier: '5',
  relationships: true,
  relationshipType: 'comment',
  queryData: {
    include: [],
    fields: {},
    sort: [],
    page: {},
    filter: []
  }
};

//EXAMPLE 2
let url = '/article/5/?include=user,comment.user&fields[article]=title,body&page[limit]=20&sort=-createdon'
let requestData = {
  resourceType: 'article',
  identifier: '5',
  relationships: false,
  relationshipType: null,
  queryData: {
    include: ['user', 'comment.user'],
    fields: {
      article: ['title', 'body']
    },
    sort: ['-createdon'],
    page: {
      limit: 20
    },
    filter: []
  }
};
```


## Important

If your endpoints contain versioning or other application specific pointers please remove them before parsing!
Here are some examples of a request url:

```js
  let CORRECT1 = '/article/';
  let CORRECT2 = '/article/5?include=comments';
  let CORRECT3 = '/article/5/relationships/comments';
  let CORRECT4 = '/article/?include=user,comment.rating&fields[article]=title,body&fields[user]=name';

  // Contains '/v1/api' which cannot be parsed properly
  let INVALID = '/v1/api/article?include=user';
```

## Missing 'filter' implementation!

Filters are not properly parsed since there are no specifications for this query yet! I hope to update this package
as soon as filtering specs are available.


## Missing Tests! - UPDATE: Not missing anymore!

Tests running using mocha & chai in /test


