import * as path from "path";

export class WebContentType {
    static TYPE = {
        HTML: {
            contentType: 'text/html',
            fileExtensions: ['.html'],
            resourceLocation: '/'
        },
        JAVASCRIPT: {
            contentType: 'application/javascript',
            fileExtensions: ['.js', '.vue_app'],
            resourceLocation: '/scripts'
        },
        STYLE: {
            contentType: 'text/css',
            fileExtensions: ['.css'],
            resourceLocation: '/styles'
        },
        FONT: {
            contentType: 'font/woff2',
            fileExtensions: ['.woff2', 'woff'],
            resourceLocation: '/fonts'
        },
    };

    static determineContentType(fileName) {
        let fileExtension = path.extname(fileName);
        for (let key in WebContentType.TYPE) {
            const type = WebContentType.TYPE[key];
            if (type.fileExtensions.indexOf(fileExtension) > -1)
                return type;
        }
    }
}