# jsonapi-query-parser

JsonApiQueryParser class to parse endpoint and its query string parameters to a usable request object.

To be used for node projects that make use of [JSON API](http://jsonapi.org/)


## Installation

```sh
$ npm install jsonapi-query-parser
```

## Usage

Require the module 'JsonApiQueryParser' into your application and use the 'parseRequest' function to convert the request.url to an easy
usable requestData object.

```js
let JsonApiQueryParserClass = require('jsonapi-query-parser');
let JsonApiQueryParser = new JsonApiQueryParserClass();

http.createServer(function (request, response) {
  let requestData = JsonApiQueryParser.parseRequest(request.url);

  // .. Do stuff with your requestData object

}).listen(1337, '127.0.0.1');
```

## Return data information (requestData)

The object returned by the JsonApiQueryParser.parseRequest will always be the same structure.
Please note that the query parameters are decoded when parsed!
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
    filter: {
      like: {},
      not: {},
      lt: {},
      lte: {},
      gt: {},
      gte: {}
    }
  }
};

//EXAMPLE 2
let url = '/article/5/?include=user,comment.user&fields[article]=title%2Cbody&page[limit]=20&sort=-createdon'
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
    filter: {
      like: {},
      not: {},
      lt: {},
      lte: {},
      gt: {},
      gte: {}
    }
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

## Custom 'filter' implementation!

Filters might not be properly parsed since there are no specifications for this query yet! I hope to update this package
as soon as filtering specs are available.
For now the filters are handled like the fields parameter.

FilterType is also not supported by JSON API spec. This feature can be used to filter on partial matches, less than, greater than, and more. 
The feature is currently implemented for [bookshelf-jsonapi-params](https://github.com/scoutforpets/bookshelf-jsonapi-params).

```js
//EXAMPLE 1
let url = '/article/5?filter[name]=john%20doe&&filter[age][lt]=15'
let requestData = {
  resourceType: 'article',
  identifier: '5',
  relationships: false,
  relationshipType: null,
  queryData: {
    include: [],
    fields: {},
    sort: [],
    page: {},
    filter: {
      name: 'john doe',
      age: '15',
      like: {},
      not: {},
      lt: {
        age: '15'
      },
      lte: {},
      gt: {},
      gte: {}
    }
  }
};

// alechirsh filter type implementation:
let url = '/article/5?filter[not][name]=jack'
let requestData = {
  resourceType: 'article',
  identifier: '5',
  relationships: false,
  relationshipType: null,
  queryData: {
    include: [],
    fields: {},
    sort: [],
    page: {},
    filter: {
      like: {},
      not: {
        name: 'jack'
      },
      lt: {},
      lte: {},
      gt: {},
      gte: {}
    }
  }
};

//EXAMPLE 3 "OR" filtering condition:
let url = '/users?filter[or][0][not][name]=jack&filter[or][0][name]=sally&filter[or][1][type]=customer&filter[lte][age]=30'
let requestData = {
  resourceType: 'users',
  relationships: false,
  relationshipType: null,
  queryData: {
    include: [],
    fields: {},
    sort: [],
    page: {},
    filter: {
      or: [
        {
          like: {},
          not: {
            name: 'jack'
          },
          lt: {},
          lte: {},
          gt: {},
          gte: {},
          name: 'sally'          
        },
        {
          like: {},
          not: {},
          lt: {},
          lte: {},
          gt: {},
          gte: {},
          type: 'customer'  
        }
      ]
      like: {},
      not: {},
      lt: {},
      lte: {
        age: '30'
      },
      gt: {},
      gte: {}
    }
  }
};
```

## Tests!

Tests running using mocha & chai in /test


