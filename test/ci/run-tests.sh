#!/bin/bash
# Run jQuery's QUnit unit suite headlessly.
#
# Upstream drove test/index.html through TestSwarm (real browsers), which is
# gone; this serves the checkout with PHP's built-in server so the ajax
# fixtures under test/data/*.php execute, then drives test/index.html in
# headless Chromium via test/ci/run-qunit.js.
set -e

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends chromium php-cli ca-certificates

mkdir -p /tmp/runner
cd /tmp/runner
npm install --no-save --no-audit --no-fund puppeteer-core@21.11.0

cd /src
php -S 127.0.0.1:8000 -t /src >/tmp/php-server.log 2>&1 &
PHP_PID=$!
trap 'kill $PHP_PID 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
    if php -r 'exit(@file_get_contents("http://127.0.0.1:8000/test/index.html") === false ? 1 : 0);'; then
        break
    fi
    sleep 1
done

export NODE_PATH=/tmp/runner/node_modules
export CHROME_BIN=/usr/bin/chromium
node /src/test/ci/run-qunit.js
