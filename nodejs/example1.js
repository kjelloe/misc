#!/usr/bin/env node
var express = require('express');
var proxy = require('http-proxy-middleware'); // DOC: https://github.com/chimurai/http-proxy-middleware
var isDebug = true;
var index = new Array();

var targetHost = 'dev.kezzlerssp.com';
var targetProtocol = 'https://';
var localPort = 8000;
var localHost = 'localhost';

var app = express();

app.use('/', proxy(
  { 
  target: targetProtocol+targetHost, 
  changeOrigin: true,
  onProxyReq : _onProxyReq,
  onProxyRes : _onProxyRes,
  }
));

function _onProxyReq(proxyReq, req, res) {
  var proxyUrl = proxyReq._headers['host']+ proxyReq.path;
  if(index[proxyUrl]==null || isDebug===true) {
    index[proxyUrl] = 1;
    console.log('REQUEST: '+ proxyUrl);
  }
}


function _onProxyRes(proxyRes, req, res) {
  var cookieHeader = proxyRes.headers['set-cookie'];
  if(cookieHeader!==undefined) { 
     console.log('SET-COOKIE removing secure requirement for reverse proxying from: ' + cookieHeader); 
     proxyRes.headers['set-cookie'] = cookieHeader[0].replace('Secure;','');
  }

  var checkHeader = proxyRes.headers['location'];
  if(checkHeader!==undefined && checkHeader.indexOf(targetHost)!=-1) {
    var newHeader = checkHeader.replace(targetHost, localHost+':'+localPort).replace('https:','http:');    
    console.log('REWRITING LOCATION: ' + checkHeader + ' TO: ' + newHeader);
    proxyRes.headers['location'] = newHeader;
  }   
}

app.listen(localPort);
