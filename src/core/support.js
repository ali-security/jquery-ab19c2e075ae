define([
	"../var/support"
], function( support ) {

(function() {
	// Minified: var a
	var doc;

	// Support: IE<9, Android<3.0
	// document.implementation.createHTMLDocument is missing there, so accessing
	// or calling it must not be allowed to throw while the module is loading
	try {
		doc = document.implementation.createHTMLDocument( "" );
		doc.body.innerHTML = "<form></form><form></form>";

		// Support: Safari 8+, iOS 8+
		// createHTMLDocument exists but mangles multiple forms
		support.createHTMLDocument = doc.body.childNodes.length === 2;
	} catch ( e ) {
		support.createHTMLDocument = false;
	}
})();

return support;

});
