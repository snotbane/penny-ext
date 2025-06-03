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
function activate(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.tooltip = "Penny word count is calculated from any strings using double quotes or backticks.\nDoesn't include single quotes.";
    context.subscriptions.push(statusBarItem);
    const updateWordCount = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBarItem.hide();
            return;
        }
        const text = editor.document.getText();
        const metrics = getMetrics(text);
        statusBarItem.text = `${metrics.wordCount} words`;
        statusBarItem.tooltip = `${metrics.wordCount} words\n${metrics.charCount} chars\n${metrics.letterCount} letters\n${Math.floor(100 * metrics.letterCount / metrics.wordCount) / 100} lpw\nMetrics are approximate.`;
        statusBarItem.show();
    };
    vscode.window.onDidChangeActiveTextEditor(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(updateWordCount, null, context.subscriptions);
    updateWordCount(); // initial call
}
function getMetrics(text) {
    const stringRegex = /(?<=("""|"|```|`))(?:\\.|(?!\1)[^\\\r\n])*(?=\1)/g; // Matches simple quoted strings
    const tagRegex = /(?<!\\)<([^<>]*?)(?<!\\)>/g;
    const matches = text.match(stringRegex);
    if (!matches)
        return {
            wordCount: 0,
            charCount: 0,
            letterCount: 0,
        };
    let wordCount = 0;
    let charCount = 0;
    let letterCount = 0;
    for (const str of matches) {
        const content = str.replace(tagRegex, "");
        const words = content.split(/\s+/).filter(Boolean);
        wordCount += words.length;
        charCount += content.length;
        words.forEach(word => letterCount += word.replace(/[^A-Za-z0-9]/g, '').length);
    }
    return {
        wordCount: wordCount,
        charCount: charCount,
        letterCount: letterCount,
    };
}
function deactivate() { }
