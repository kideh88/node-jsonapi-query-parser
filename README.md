# node-jsonapi-query-parser

JsonApiQueryParser class to parse endpoint and its query string parameters to a usable request object.

To be used for ES6 node projects that make use of [JSON API](http://jsonapi.org/)


## Installation

Install using  `npm install jsonapi-query-parser`


## Usage

Require the module 'JsonApiQueryParser' into your application and use the 'parseRequest' function to convert the request.url to an easy
usable requestData object.

```
let JsonApiQueryParser = require('JsonApiQueryParser');

http.createServer(function (request, response) {
    let requestData = JsonApiQueryParser.parseRequest(request.url);
}).listen(1337, '127.0.0.1');


```


## Important

If your endpoints contain versions or other application specific pointers please remove them before parsing!
Here are some examples of a request url:

```
    let CORRECT1 = '/article/'
    let CORRECT2 = '/article/5?include=comments'
    let CORRECT3 = '/article/5/relationships/comments'
    let CORRECT4 = '/article/?include=user,comment.rating&fields[article]=title,body&fields[user]=name'
    let WRONG = '/v1/api/article?include=user
```

## Missing implementation

Filters are not properly parsed since there are no proper specifications on this part yet! I hope to update this package
as soon as filtering specs are set.




