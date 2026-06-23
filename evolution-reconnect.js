#!/usr/bin/env node
/**
 * Evolution API Auto-Reconnect Script
 * Runs every 5 minutes via cron to check and restore WhatsApp connection
 */
var http = require('http');
var fs = require('fs');

// Config
var EVO_HOST = process.env.EVO_HOST || '127.0.0.1';
var EVO_PORT = process.env.EVO_PORT || '8081';
var EVO_API_KEY = process.env.EVO_API_KEY || '269Q0BWR4LN7FJCD1VKUY53MSGP8EOZX';
var INSTANCE_NAME = process.env.EVO_INSTANCE_NAME || 'garage_new';
var LOG_FILE = process.env.EVO_LOG_FILE || '/var/log/evolution-reconnect.log';
var RETRY_COUNT = 3;
var RETRY_DELAY_MS = 5000;

function log(level, message, data) {
  var timestamp = new Date().toISOString();
  var entry = { timestamp: timestamp, level: level, message: message };
  if (data) entry.data = data;
  var line = JSON.stringify(entry);
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function makeRequest(path, method, body) {
  method = method || 'GET';
  return new Promise(function(resolve, reject) {
    var options = {
      hostname: EVO_HOST,
      port: EVO_PORT,
      path: path,
      method: method,
      headers: {
        'apikey': EVO_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    var req = http.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', function(err) { reject(err); });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function checkConnectionState() {
  log('INFO', 'Checking connection state...', { instance: INSTANCE_NAME });
  return makeRequest('/instance/connectionState/' + INSTANCE_NAME).then(function(result) {
    log('DEBUG', 'Connection state response', result);
    return result;
  });
}

function reconnect() {
  log('INFO', 'Attempting to reconnect...', { instance: INSTANCE_NAME });
  return makeRequest('/instance/connect/' + INSTANCE_NAME, 'GET').then(function(result) {
    log('DEBUG', 'Reconnect response', result);
    return result;
  });
}

function main() {
  log('INFO', '=== Evolution Auto-Reconnect Started ===');

  checkConnectionState().then(function(stateResult) {
    var state = stateResult.data && stateResult.data.state ? stateResult.data.state : null;

    if (stateResult.status === 200 && state === 'open') {
      log('INFO', 'Connection is OPEN and healthy');
      process.exit(0);
    }

    if (stateResult.status === 200 && state === 'connecting') {
      log('INFO', 'Connection is CONNECTING, waiting...');
      process.exit(0);
    }

    log('WARN', 'Connection is NOT open', {
      status: stateResult.status,
      state: state,
      code: stateResult.data && stateResult.data.statusCode ? stateResult.data.statusCode : null,
    });

    // Try reconnect with retry loop
    var attempt = 0;
    function tryReconnect() {
      attempt++;
      if (attempt > RETRY_COUNT) {
        log('ERROR', 'All reconnect attempts failed');
        process.exit(1);
        return;
      }

      log('INFO', 'Reconnect attempt ' + attempt + '/' + RETRY_COUNT);
      reconnect().then(function(reconnectResult) {
        if (reconnectResult.status === 200) {
          log('INFO', 'Reconnect triggered successfully', reconnectResult.data);

          // Wait and check again
          sleep(10000).then(function() {
            return checkConnectionState();
          }).then(function(checkAgain) {
            var newState = checkAgain.data && checkAgain.data.state ? checkAgain.data.state : null;

            if (newState === 'open') {
              log('INFO', 'Connection restored successfully!');
              process.exit(0);
            }

            if (checkAgain.data && checkAgain.data.base64) {
              log('INFO', 'QR Code generated - requires manual scan');
              process.exit(1);
            }

            // Not connected yet, try again
            sleep(RETRY_DELAY_MS).then(tryReconnect);
          });
        } else {
          log('ERROR', 'Reconnect failed', reconnectResult);
          sleep(RETRY_DELAY_MS).then(tryReconnect);
        }
      }).catch(function(err) {
        log('ERROR', 'Reconnect error', { message: err.message });
        sleep(RETRY_DELAY_MS).then(tryReconnect);
      });
    }

    tryReconnect();

  }).catch(function(error) {
    log('ERROR', 'Unexpected error', { message: error.message, stack: error.stack });
    process.exit(1);
  });
}

main();
