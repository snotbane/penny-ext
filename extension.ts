import * as vscode from 'vscode';

interface Metrics {
	wordCount: number,
	charCount: number,
	letterCount: number,
}

export function activate(context: vscode.ExtensionContext) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.tooltip = "Penny word count is calculated from any strings using double quotes or backticks.\nDoesn't include single quotes.";
	context.subscriptions.push(statusBarItem);

	const updateWordCount = () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			statusBarItem.hide();
			return;
		}

		const text = editor.document.getText()
		const metrics = getMetrics(text)
		statusBarItem.text = `${metrics.wordCount} words`
		statusBarItem.tooltip = `${metrics.wordCount} words\n${metrics.charCount} chars\n${metrics.letterCount} letters\n${Math.floor(100 * metrics.letterCount / metrics.wordCount) / 100} lpw\nMetrics are approximate.`
		statusBarItem.show()
	};

	vscode.window.onDidChangeActiveTextEditor(updateWordCount, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(updateWordCount, null, context.subscriptions);
	vscode.workspace.onDidOpenTextDocument(updateWordCount, null, context.subscriptions);

	updateWordCount(); // initial call
}
	function getMetrics(text: string): Metrics {
	const stringRegex = /(?<!#.*)(?<=("""|"|```|`))(?:\\.|(?!\1)[^\\\r\n])*(?=\1)/g; // Matches simple quoted strings
	const tagRegex = /(?<!\\)<([^<>]*?)(?<!\\)>/g
	const matches = text.match(stringRegex);
	if (!matches) return {
		wordCount: 0,
		charCount: 0,
		letterCount: 0,
	};

	let wordCount = 0;
	let charCount = 0;
	let letterCount = 0;
	for (const str of matches) {
		const content = str.replace(tagRegex, "")
		const words = content.split(/\s+/).filter(Boolean);
		wordCount += words.length;
		charCount += content.length;
		words.forEach(word => letterCount += word.replace(/[^A-Za-z0-9]/g, '').length)
	}
	return {
		wordCount: wordCount,
		charCount: charCount,
		letterCount: letterCount,
	};
}

export function deactivate() {}
