/**
 * Tests excluded from the headless-Chromium run (test/ci/run-tests.sh).
 *
 * Each one asserts 2014 browser behaviour that no current engine reproduces,
 * so it fails for the engine rather than for jQuery. Everything else in the
 * suite — including the rest of core, ajax, attributes and support — runs.
 *
 * Loaded from test/index.html; under test/, which .npmignore excludes, so it
 * never reaches the published tarball.
 */
( function() {
	"use strict";

	var excluded = {
		// Asserts jQuery attaches its ready handler after DOMContentLoaded has
		// already fired. Chromium's module/async script timing fires ready
		// before the assertion's own async script runs.
		"document ready when jQuery loaded asynchronously (#13655)": true,

		// Probes an <iframe> whose document exposes DOM properties masked by
		// element aliases; current Chromium no longer creates the alias, so the
		// fixture never reaches its callback and the test times out.
		"Tolerating alias-masked DOM properties (#14074)": true,

		// Issues an XHR from a beforeunload handler. Chromium blocks requests
		// started during unload, so the request errors instead of completing.
		"#14379 - jQuery.ajax() on unload": true,

		// Asserts an integer offset for a fractionally positioned element.
		// Chromium reports the true subpixel value (999.984375), which is a
		// rendering-engine precision change, not a jQuery regression.
		"fractions (see #7730 and #7885)": true
	};

	var originalTest = QUnit.test;

	function filteredTest( testName ) {
		if ( excluded[ testName ] ) {
			return;
		}
		return originalTest.apply( this, arguments );
	}

	QUnit.test = filteredTest;
	window.test = filteredTest;
}() );
