"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// interface Metrics {
// 	wordCount: number,
// 	charCount: number,
// 	letterCount: number,
// }
function approxString(x) {
    const delimitK = x / 1000.0;
    if (delimitK > 1.0) {
        return String(Math.floor(x / 100.0) / 10.0) + "K";
    }
    else {
        return String(x);
    }
}
class Metrics {
    constructor() {
        this.blockCount = 0;
        this.wordCount = 0;
        this.charCount = 0;
        this.letterCount = 0;
        this.blockCountIncludingComments = 0;
        this.wordCountIncludingComments = 0;
        this.charCountIncludingComments = 0;
        this.letterCountIncludingComments = 0;
        this.linesProcessed = 0;
    }
    get messageShort() {
        return `${this.wordCountApproxString} words`;
    }
    get messageLong() {
        return ``
            .concat(`${this.blockCount} blocks\n`)
            .concat(`${this.wordCount} words\n`)
            .concat(`${this.charCount} chars\n`)
            .concat(`${this.letterCount} letters\n`)
            .concat(`${this.lettersPerWord} lpw\n`)
            .concat(`\n`)
            .concat(`Including comments:\n`)
            .concat(`${this.blockCountIncludingComments} blocks\n`)
            .concat(`${this.wordCountIncludingComments} words\n`)
            .concat(`${this.charCountIncludingComments} chars\n`)
            .concat(`${this.letterCountIncludingComments} letters\n`)
            .concat(`${this.lettersPerWordIncludingComments} lpw\n`);
    }
    get lettersPerWord() {
        if (this.wordCount == 0)
            return 0;
        return Math.floor(100 * this.letterCount / this.wordCount) / 100;
    }
    get lettersPerWordIncludingComments() {
        if (this.wordCountIncludingComments == 0)
            return 0;
        return Math.floor(100 * this.letterCountIncludingComments / this.wordCountIncludingComments) / 100;
    }
    get wordCountApproxString() {
        return approxString(this.wordCount);
    }
    append(other) {
        this.blockCount += other.blockCount;
        this.wordCount += other.wordCount;
        this.charCount += other.charCount;
        this.letterCount += other.letterCount;
        this.blockCountIncludingComments += other.blockCountIncludingComments;
        this.wordCountIncludingComments += other.wordCountIncludingComments;
        this.charCountIncludingComments += other.charCountIncludingComments;
        this.letterCountIncludingComments += other.letterCountIncludingComments;
    }
}
function activate(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);
    const updateWordCount = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBarItem.hide();
            return;
        }
        const text = editor.document.getText();
        const metrics = getMetrics(text);
        statusBarItem.text = metrics.messageShort;
        statusBarItem.tooltip = metrics.messageLong;
        statusBarItem.show();
    };
    vscode.window.onDidChangeActiveTextEditor(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(updateWordCount, null, context.subscriptions);
    updateWordCount(); // initial call
}
function getMetrics(text) {
    const result = new Metrics();
    const lines = text.split('\n');
    for (const line of lines) {
        result.append(getMetricsForLine(line));
    }
    return result;
}
function getMetricsForLine(line) {
    const result = new Metrics();
    const STRING_REGEX = /(.*#.*)?[>\+](?!=)[\t ]*(.*)/g;
    const matches = STRING_REGEX.exec(line);
    if (matches == null)
        return result;
    const isComment = matches[1] != null;
    const str = matches[2];
    const TAG_REGEX = /(?<!\\)<([^<>]*?)(?<!\\)>/g;
    const content = str.replace(TAG_REGEX, "");
    const words = content.split(/\s+/g).filter(Boolean);
    if (!isComment) {
        result.blockCount += 1;
        result.wordCount += words.length;
        result.charCount += content.length;
        words.forEach(word => result.letterCount += word.replace(/[^A-Za-z0-9]/g, '').length);
    }
    result.blockCountIncludingComments += 1;
    result.wordCountIncludingComments += words.length;
    result.charCountIncludingComments += content.length;
    words.forEach(word => result.letterCountIncludingComments += word.replace(/[^A-Za-z0-9]/g, '').length);
    return result;
}
function deactivate() { }
