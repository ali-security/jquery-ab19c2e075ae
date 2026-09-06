// Headless-browser driver for jQuery's QUnit suite.
//
// jQuery 1.11 shipped no runnable-in-CI test harness: upstream drove
// test/index.html through TestSwarm, which no longer exists. This loads the
// same test/index.html in headless Chromium (served over HTTP by PHP so the
// ajax fixtures under test/data/*.php execute) and reports the QUnit result.
//
// Lives under test/, which .npmignore excludes, so it never reaches the tarball.

var puppeteer = require( "puppeteer-core" );

var URL = process.env.QUNIT_URL || "http://127.0.0.1:8000/test/index.html";
var CHROME = process.env.CHROME_BIN || "/usr/bin/chromium";
var TIMEOUT_MS = 15 * 60 * 1000;

function hookQUnit() {
	window.__qunitFailures = [];
	window.__qunitResult = null;
	var stored;
	function install( QUnit ) {
		if ( !QUnit || QUnit.__hooked ) {
			return;
		}
		QUnit.__hooked = true;
		QUnit.log( function( details ) {
			if ( !details.result ) {
				window.__qunitFailures.push(
					details.module + ": " + details.name + " — " +
					( details.message || "" ) +
					" (expected " + JSON.stringify( details.expected ) +
					", actual " + JSON.stringify( details.actual ) + ")"
				);
			}
		} );
		QUnit.done( function( details ) {
			window.__qunitResult = details;
		} );
	}
	Object.defineProperty( window, "QUnit", {
		configurable: true,
		get: function() {
			return stored;
		},
		set: function( value ) {
			stored = value;
			install( value );
		}
	} );
}

( function() {
	var browser;
	puppeteer.launch( {
		executablePath: CHROME,
		headless: "new",
		args: [ "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu" ]
	} ).then( function( b ) {
		browser = b;
		return b.newPage();
	} ).then( function( page ) {
		page.on( "pageerror", function( err ) {
			console.log( "PAGE ERROR: " + err.message );
		} );
		return page.evaluateOnNewDocument( hookQUnit )
			.then( function() {
				return page.goto( URL, { waitUntil: "domcontentloaded", timeout: 120000 } );
			} )
			.then( function() {
				return page.waitForFunction(
					"window.__qunitResult !== null",
					{ timeout: TIMEOUT_MS, polling: 2000 }
				);
			} )
			.then( function() {
				return page.evaluate( function() {
					return {
						result: window.__qunitResult,
						failures: window.__qunitFailures
					};
				} );
			} );
	} ).then( function( out ) {
		var r = out.result;
		console.log( "=== jQuery QUnit suite ===" );
		console.log(
			"Tests run: " + r.total + " assertions, " +
			r.passed + " passed, " + r.failed + " failed, " +
			"runtime " + r.runtime + "ms"
		);
		out.failures.forEach( function( f ) {
			console.log( "FAILED: " + f );
		} );
		return browser.close().then( function() {
			if ( r.failed > 0 || r.total === 0 ) {
				console.log( "QUnit suite FAILED" );
				process.exit( 1 );
			}
			console.log( "QUnit suite PASSED" );
			process.exit( 0 );
		} );
	} ).catch( function( err ) {
		console.log( "RUNNER ERROR: " + ( err && err.stack || err ) );
		if ( browser ) {
			browser.close();
		}
		process.exit( 1 );
	} );
}() );
