//
// Streams the given file as the response using the mime type and file name
//
module.exports = function(res, file, name, mime) {
	var fs = require('fs');
	fs.exists(file, function(yes) {
		if (!yes) {
			return res.status(404).send({
				message: 'Not Found'
			});
		} else {
			res.setHeader('Content-Type', mime);
			res.setHeader('Content-Type', 'application/octet-stream');
			res.setHeader('Content-Description', 'File Transfer');
			res.setHeader('Content-Transfer-Encoding', 'binary');
			res.setHeader('Content-Disposition', 'attachment; inline=false; filename="' + name + '"');
			fs.createReadStream(file).pipe(res);
		}
	});
}
