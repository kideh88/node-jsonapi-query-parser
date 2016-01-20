'use strict';

/**
 * [Defines the available parse function names and their matching patterns.]
 **/
let PARSE_PARAM = Object.freeze({
  parseInclude: /^include\=(.*?)/i,
  parseFields: /^fields\[(.*?)\]\=.*?$/i,
  parsePage: /^page\[(.*?)\]\=.*?$/i,
  parseSort: /^sort\=(.*?)/i,
  parseFilter: /^filter\=(.*?)/i // NOT IMPLEMENTED PROPERLY DUE TO LACK OF SPECS
});


class JsonApiQueryParser {

  /**
   * [Defines the requestData object to modify via given queryString. NOTE: filter query is not implemented due to lack of specs.]
   *
   * @param {[string]} url [Required url containing the endpoint path and query string.]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  parseRequest (url) {
    let requestData = {
      resourceType: null,
      identifier: null,
      relationships: false,
      relationshipType: null,
      queryData: {
        include: [],
        fields: {},
        sort: [],
        page: {},
        filter: []
      }
    };

    let urlSplit = url.split('?');
    requestData = this.parseEndpoint(urlSplit[0], requestData);

    if(urlSplit[1]) {
      requestData = this.parseQueryParameters(urlSplit[1], requestData.queryData);
    }

    return requestData;
  }

  /**
   * [Cuts up the endpoint path to define the requested resource, identifier and relationships.]
   *
   * @param {[string]} endpointString [Required endpoint string. Example: "/articles/6/comments".]
   * @param {[object]} requestObject [Required reference to the main requestData object.]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  parseEndpoint (endpointString, requestObject) {
    let requestSplit = JsonApiQueryParser.trimSlashes(endpointString).split('/');
    requestObject.resourceType = requestSplit[0];
    requestObject.identifier = (requestSplit.length === 2 ? requestSplit[1] : null);
    requestObject.relationships = (requestSplit.length === 3 && requestSplit[2].toLowerCase() === 'relationships');
    if(requestObject.relationships) {
      if(!requestSplit[3]) {
        throw new ReferenceError('Request missing relationship type', 'JsonApiQueryParser.js');
      } else {
        requestObject.relationshipType = requestSplit[3]
      }
    } else {
      requestObject.relationshipType = (requestSplit.length === 3 ? requestSplit[2] : null);
    }

    return requestObject;
  }

  /**
   * [Cuts up the query parameters and sends each piece to the delegate function.]
   *
   * @param {[string]} queryString [Required query string. Example: "?include=comments,user&fields[article]=title,body" ]
   * @param {[object]} requestObject [Required reference to the main requestData object.]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  parseQueryParameters (queryString, requestObject) {
    let querySplit = queryString.split('&');
    querySplit.forEach(this.delegateToParser, requestObject);

    return requestObject;
  }

  /**
   * [Delegates each query string piece to its own parser function.]
   *
   * @param {[string]} query [Required query string piece. Example: "fields[article]=title,body".]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  delegateToParser (query) {
    // NOTE: 'this' points to requestObject!
    let _requestDataSubset = this;
    let functionName;

    for(functionName in PARSE_PARAM) {
      if(PARSE_PARAM[functionName].test(query)) {
        _requestDataSubset = JsonApiQueryParser[functionName](query, _requestDataSubset);
      }
    }
  }

  /**
   * [Parses the include query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} includeString [Required include string piece. Example: "include=comments,user".]
   * @param {[object]} _requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} _requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseInclude (includeString, _requestDataSubset) {
    // Kept simple for now, does not parse dot-separated relationships (comment.user)
    let targetString = includeString.toLowerCase().replace('include=', '');
    _requestDataSubset.include = targetString.split(',');

    return _requestDataSubset;
  }

  /**
   * [Parses the fields query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} fieldsString [Required fields query string piece. Example: "fields[article]=title,body".]
   * @param {[object]} _requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} _requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseFields (fieldsString, _requestDataSubset) {
    let targetResource;
    let targetFields;
    let targetFieldsString;
    let fieldNameRegex = /^fields.*?\=(.*?)$/i;

    targetResource = fieldsString.replace(PARSE_PARAM.parseFields, function(match, $1, $2, $3) {
      return $1;
    });

    targetFieldsString = fieldsString.replace(fieldNameRegex, function(match, $1, $2, $3) {
      return $1;
    });

    _requestDataSubset.filter[targetResource] = (!_requestDataSubset.filter[targetResource] ? [] : _requestDataSubset.filter[targetResource]);
    targetFields = targetFieldsString.split(',');

    targetFields.forEach(function(targetField) {
      _requestDataSubset.filter[targetResource].push(targetField);
    });

    return _requestDataSubset;
  }

  /**
   * [Parses the page query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} pageString [Required page query string piece. Example: "page[offset]=20".]
   * @param {[object]} _requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} _requestDataSubset [Returning the modified request data.]
   *
   **/
  static parsePage (pageString, _requestDataSubset) {
    let pageSettingKey;
    let pageSettingValue;
    let pageValueRegex = /^page.*?\=(.*?)$/i;

    pageSettingKey = pageString.replace(PARSE_PARAM.parsePage, function(match, $1, $2, $3) {
      return $1;
    });

    pageSettingValue = pageString.replace(pageValueRegex, function(match, $1, $2, $3) {
      return $1;
    });

    _requestDataSubset.page[pageSettingKey] = pageSettingValue;

    return _requestDataSubset;
  }

  /**
   * [Parses the sort query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} sortString [Required sort query string piece. Example: "sort=-created,title".]
   * @param {[object]} _requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} _requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseSort (sortString, _requestDataSubset) {
    let targetString = sortString.toLowerCase().replace('sort=', '');
    _requestDataSubset.sort = targetString.split(',');

    return _requestDataSubset;
  }

  /**
   * [Not implemented due to lack of specifications, instead it will save the filter query in requestData.filter.]
   *
   * @param {[string]} filterString [Required sort query string piece. Example: MISSING.]
   * @param {[object]} _requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} _requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseFilter (filterString, _requestDataSubset) {
    // NOT IMPLEMENTED PROPERLY, WILL KEEP STRINGS IN FILTER ARRAY
    _requestDataSubset.filter.push(filterString);
    return _requestDataSubset;
  }

  /**
   * [Slash trim to avoid faulty endpoint mapping.]
   *
   * @param {[string]} input [Required input to be trimmed. Example: "/article/1/".]
   * @return {[string]} [Returning the modified string.]
   *
   **/
  static trimSlashes (input) {
    return input.replace(/(^\/)|(\/$)/g, "");
  };

}

module.exports = JsonApiQueryParser;
