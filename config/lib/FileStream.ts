'use strict';

import fs from 'fs';

// Streams the given file as the response using the mime type and file name
export default class FileStream {
	public stream(res, file, name, mime) {
		fs.exists(file, yes => {
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
}
