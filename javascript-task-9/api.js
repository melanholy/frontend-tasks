'use strict';

var https = require('https');
var fs = require('fs');
var path_ = require('path');

var API_HOST = 'api.github.com';

function getToken() {
    try {
        return fs.readFileSync(path_.join(__dirname, 'token.txt'), 'ascii').trim();
    } catch (error) {

        /* Без токена можно делать лишь сильно ограниченное количество запросов */
        return '';
    }
}

var API_TOKEN = getToken();

function makeRequestJson(method, options, content, callback) {
    makeRequest(method, options, content, function (error, response) {
        if (error) {
            callback(error);

            return;
        }

        try {
            callback(null, JSON.parse(response));
        } catch (err) {
            callback(err);
        }
    });
}

function makeRequest(method, path, content, callback) {
    var options = {
        path: path,
        method: method,
        headers: { 'User-Agent': 'node.js' },
        hostname: API_HOST
    };

    if (API_TOKEN) {
        options.headers.Authorization = 'token ' + API_TOKEN;
    }
    if (method === 'POST') {
        options.headers['Content-Length'] = Buffer.byteLength(content);
        options.headers['Content-Type'] = 'text/plain';
    }

    var request = https.request(options);

    request.on('response', function (response) {
        var body = '';

        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function () {
            callback(null, body);
        });
    }).on('error', callback);

    if (method === 'POST') {
        request.write(content);
    }

    request.end();
}

exports.getOrganizationRepos = function (organization, callback) {
    var path = '/orgs/' + organization + '/repos';

    makeRequestJson('GET', path, '', callback);
};

exports.getRepo = function (owner, repo, callback) {
    var path = '/repos/' + owner + '/' + repo;

    makeRequestJson('GET', path, '', callback);
};

exports.getReadme = function (owner, repo, callback) {
    var path = '/repos/' + owner + '/' + repo + '/readme';

    makeRequestJson('GET', path, '', callback);
};

exports.renderMarkdown = function (text, callback) {
    var path = '/markdown/raw';

    makeRequest('POST', path, text, callback);
};
