'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chrome_launcher_1 = require("chrome-launcher");
const random_port_1 = require("chrome-launcher/random-port");
const CDP = require("chrome-remote-interface");
const CreateResult_1 = require("./CreateResult");
exports.CreateResult = CreateResult_1.CreateResult;
/**
 * Generates a PDF from the given HTML string, launching Chrome as necessary.
 *
 * @export
 * @param {string} html the HTML string.
 * @param {Options} [options] the generation options.
 * @returns {Promise<CreateResult>} the generated PDF data.
 */
function create(html, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const myOptions = Object.assign({}, options);
        let chrome;
        if (!myOptions.host && !myOptions.port) {
            myOptions.port = yield random_port_1.getRandomPort();
            chrome = yield launchChrome(myOptions.port);
        }
        try {
            return yield generate(html, myOptions);
        }
        finally {
            if (chrome) {
                yield chrome.kill();
            }
        }
    });
}
exports.create = create;
/**
 * Connects to Chrome and generates a PDF from HTML or a URL.
 *
 * @param {string} html the HTML string or URL.
 * @param {CreateOptions} options the generation options.
 * @returns {Promise<CreateResult>} the generated PDF data.
 */
function generate(html, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield CDP(options);
        try {
            const { Page } = client;
            yield Page.enable(); // Enable Page events
            const url = /^(https?|file|data):/i.test(html) ? html : `data:text/html,${html}`;
            yield Page.navigate({ url });
            yield Page.loadEventFired();
            // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-printToPDF
            const pdf = yield Page.printToPDF(options.printOptions);
            return new CreateResult_1.CreateResult(pdf.data);
        }
        finally {
            client.close();
        }
    });
}
/**
 * Launches Chrome and listens on the specified port.
 *
 * @param {number} port the port for the launched Chrome to listen on.
 * @returns {Promise<Launcher>} The launched Launcher instance.
 */
function launchChrome(port) {
    return __awaiter(this, void 0, void 0, function* () {
        const launcher = new chrome_launcher_1.Launcher({
            port,
            chromeFlags: [
                '--disable-gpu',
                '--headless',
            ],
        });
        try {
            yield launcher.launch();
            return launcher;
        }
        catch (err) {
            yield launcher.kill();
            throw err;
        }
    });
}

//# sourceMappingURL=index.js.map
