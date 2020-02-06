'use strict';

/**
 * [Defines the available parse function names and their matching patterns.]
 **/
const PARSE_PARAM = Object.freeze ({
  parseInclude: /^include\=(.*?)/i,
  parseFields: /^fields\[(.*?)\]\=.*?$/i,
  parsePage: /^page\[(.*?)\]\=.*?$/i,
  parseSort: /^sort\=(.*?)/i,
  parseFilter: /^filter\[([^\]]*?)\]\=.*?$/i,
  parseFilterType: /^filter\[([^or].*?)\]\[(.*?)\]\=(.*?)$/i,
  parseFilterWithOr: /^filter\[or\]\[(\d+)\](\[[^or].*?\]\[.*?\]\=.*?|\[[^\]]*?\]\=.*?){1}$/i,
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
        filter: {
          or: [],
          like: {},
          not: {},
          lt: {},
          lte: {},
          gt: {},
          gte: {},
        },
      },
    };

    let urlSplit = url.split ('?');
    requestData = this.parseEndpoint (urlSplit[0], requestData);

    if (urlSplit[1]) {
      requestData.queryData = this.parseQueryParameters (
        urlSplit[1],
        requestData.queryData
      );
    }

    return requestData;
  }

  /**
   * [Cuts up the endpoint path to define the requested resource, identifier and relationships.]
   *
   * @param {[string]} endpointString [Required endpoint string. Example: "articles/6/comments".]
   * @param {[object]} requestObject [Required reference to the main requestData object.]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  parseEndpoint (endpointString, requestObject) {
    let requestSplit = JsonApiQueryParser.trimSlashes (endpointString).split (
      '/'
    );

    requestObject.resourceType = requestSplit[0];
    requestObject.identifier = requestSplit.length >= 2
      ? requestSplit[1]
      : null;
    requestObject.relationships =
      requestSplit.length >= 3 &&
      requestSplit[2].toLowerCase () === 'relationships';

    if (requestObject.relationships) {
      if (!requestSplit[3]) {
        throw new ReferenceError (
          'Request missing relationship type',
          'JsonApiQueryParser.js'
        );
      } else {
        requestObject.relationshipType = requestSplit[3];
      }
    } else {
      requestObject.relationshipType = requestSplit.length === 3
        ? requestSplit[2]
        : null;
    }

    return requestObject;
  }

  /**
   * [Cuts up the query parameters and sends each piece to the delegate function.]
   *
   * @param {[string]} queryString [Required query string. Example: "?include=comments,user&fields[article]=title,body" ]
   * @param {[object]} requestDataSubset [Required reference to the main requestData object.]
   * @return {[object]} requestData [Parsed request information as object.]
   *
   **/
  parseQueryParameters (queryString, requestDataSubset) {
    let querySplit = queryString.split ('&');
    querySplit = querySplit.map (function (queryPart) {
      return decodeURIComponent (queryPart);
    });
    querySplit.forEach (this.delegateToParser, requestDataSubset);

    return requestDataSubset;
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

    for (functionName in PARSE_PARAM) {
      if (PARSE_PARAM[functionName].test (query)) {
        _requestDataSubset = JsonApiQueryParser[functionName] (
          query,
          _requestDataSubset
        );
      }
    }
  }

  /**
   * [Parses the include query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} includeString [Required include string piece. Example: "include=comments,user".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseInclude (includeString, requestDataSubset) {
    // Kept simple for now, does not parse dot-separated relationships (comment.user)
    let targetString = includeString.split ('=')[1];
    requestDataSubset.include = targetString.split (',');

    return requestDataSubset;
  }

  /**
   * [Parses the fields query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} fieldsString [Required fields query string piece. Example: "fields[article]=title,body".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseFields (fieldsString, requestDataSubset) {
    let targetResource;
    let targetFields;
    let targetFieldsString;
    let fieldNameRegex = /^fields.*?\=(.*?)$/i;

    targetResource = fieldsString.replace (PARSE_PARAM.parseFields, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    targetFieldsString = fieldsString.replace (fieldNameRegex, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    requestDataSubset.fields[targetResource] = !requestDataSubset.fields[
      targetResource
    ]
      ? []
      : requestDataSubset.fields[targetResource];
    targetFields = targetFieldsString.split (',');

    targetFields.forEach (function (targetField) {
      requestDataSubset.fields[targetResource].push (targetField);
    });

    return requestDataSubset;
  }

  /**
   * [Parses the page query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} pageString [Required page query string piece. Example: "page[offset]=20".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parsePage (pageString, requestDataSubset) {
    let pageSettingKey;
    let pageSettingValue;
    let pageValueRegex = /^page.*?\=(.*?)$/i;

    pageSettingKey = pageString.replace (PARSE_PARAM.parsePage, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    pageSettingValue = pageString.replace (pageValueRegex, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    requestDataSubset.page[pageSettingKey] = pageSettingValue;

    return requestDataSubset;
  }

  /**
   * [Parses the sort query string piece and returns the modified _requestDataSubset.]
   *
   * @param {[string]} sortString [Required sort query string piece. Example: "sort=-created,title".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseSort (sortString, requestDataSubset) {
    let targetString = sortString.split ('=')[1];
    requestDataSubset.sort = targetString.split (',');

    return requestDataSubset;
  }

  /**
   * [Note: The are no proper specifications for this parameter yet.
   * For now the filter is implemented similar to the fields parameter. Values should be url encoded to allow for special characters.]
   *
   * @param {[string]} filterString [Required sort query string piece. Example: "filter[name]=John%20Doe".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseFilter (filterString, requestDataSubset) {
    let targetColumn;
    let targetFilterString;
    let filterNameRegex = /^filter.*?\=(.*?)$/i;

    targetColumn = filterString.replace (PARSE_PARAM.parseFilter, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    targetFilterString = filterString.replace (filterNameRegex, function (
      match,
      $1,
      $2,
      $3
    ) {
      return $1;
    });

    requestDataSubset.filter[targetColumn] = targetFilterString;

    return requestDataSubset;
  }

  /**
   * [Note: The are no proper specifications for this parameter yet.
   * For now the filter is implemented similar to the fields parameter. Values should be url encoded to allow for special characters.]
   *
   * @param {[string]} filterString [Required sort query string piece. Example: "filter[name][like]=John%20Doe".]
   * @param {[object]} requestDataSubset [Required reference to the requestData.queryData object.]
   * @return {[object]} requestDataSubset [Returning the modified request data.]
   *
   **/
  static parseFilterType (filterString, requestDataSubset) {
    let targetType;
    let targetColumn;
    let targetFilterString;

    targetType = filterString.replace (PARSE_PARAM.parseFilterType, function (
      match,
      $1
    ) {
      return $1;
    });

    targetColumn = filterString.replace (PARSE_PARAM.parseFilterType, function (
      match,
      $1,
      $2
    ) {
      return $2;
    });

    targetFilterString = filterString.replace (
      PARSE_PARAM.parseFilterType,
      function (match, $1, $2, $3) {
        return $3;
      }
    );

    if (requestDataSubset.filter[targetType]) {
      requestDataSubset.filter[targetType][targetColumn] = targetFilterString;
    }

    return requestDataSubset;
  }

  static parseFilterWithOr (filterString, requestDataSubset) {
    const index = parseInt(filterString.replace (PARSE_PARAM.parseFilterWithOr, (match, $1) => $1));
    const targetFilterFragment = filterString.replace (PARSE_PARAM.parseFilterWithOr, (match, $1, $2) => $2);
    const subFilterString = `filter${targetFilterFragment}`;
    const subFilterInitialSet = {
      filter: {
        like: {},
        not: {},
        lt: {},
        lte: {},
        gt: {},
        gte: {},
      }
    };
    const { filter } = PARSE_PARAM.parseFilter.test (subFilterString)
      ? JsonApiQueryParser.parseFilter(subFilterString, subFilterInitialSet)
      : JsonApiQueryParser.parseFilterType(subFilterString, subFilterInitialSet);
    if (typeof requestDataSubset.filter.or[index] === 'undefined') {
      requestDataSubset.filter.or[index] = filter;  
    } else {
      requestDataSubset.filter.or[index] = JsonApiQueryParser.deepMerge(
        requestDataSubset.filter.or[index],
        filter,
      );  
    }
    return requestDataSubset;
  }

  /**
   * [Slash trim to avoid faulty endpoint mapping. Runs recursively to remove any double slash errors]
   *
   * @param {[string]} input [Required input to be trimmed. Example: "/article/1/".]
   * @return {[string]} [Returning the modified string.]
   *
   **/
  static trimSlashes (input) {
    let slashPattern = /(^\/)|(\/$)/;
    let trimmed = input.replace (slashPattern, '');
    if (slashPattern.test (trimmed)) {
      return JsonApiQueryParser.trimSlashes (trimmed);
    } else {
      return trimmed;
    }
  }

  static deepMerge(target = {}, source = {}) {
    Object.keys(source).forEach(key => {
        if (
            typeof source[key] === 'object' &&
            !Array.isArray(source[key])
        ) {
            if (!target.hasOwnProperty(key)) {
                target[key] = {};
            }
            JsonApiQueryParser.deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    });
    return target;
  }
}

module.exports = JsonApiQueryParser;
