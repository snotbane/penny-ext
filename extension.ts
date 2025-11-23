import * as vscode from 'vscode';

function approxString(x: number) : string {
    const delimitK = x / 1000.0
    if (delimitK > 1.0) {
        return String(Math.floor(x / 100.0) / 10.0) + "K"
    } else {
        return String(x)
    }
}

class Metrics {
    blockCount: number = 0;
    wordCount: number = 0;
    charCount: number = 0;
    letterCount: number = 0;
    blockCountIncludingComments: number = 0;
    wordCountIncludingComments: number = 0;
    charCountIncludingComments: number = 0;
    letterCountIncludingComments: number = 0;
    linesProcessed: number = 0;

    get messageShort(): string {
        return `${this.wordCountApproxString} words`
    }

    get messageLong(): string {
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
            .concat(`${this.lettersPerWordIncludingComments} lpw\n`)
    }

    get lettersPerWord(): number {
        if (this.wordCount == 0) return 0
        return Math.floor(100 * this.letterCount / this.wordCount) / 100
    }

    get lettersPerWordIncludingComments(): number {
        if (this.wordCountIncludingComments == 0) return 0
        return Math.floor(100 * this.letterCountIncludingComments / this.wordCountIncludingComments) / 100
    }

    get wordCountApproxString(): string {
        return approxString(this.wordCount)
    }

    append(other: Metrics) : void {
        this.blockCount += other.blockCount
        this.wordCount += other.wordCount
        this.charCount += other.charCount
        this.letterCount += other.letterCount
        this.blockCountIncludingComments += other.blockCountIncludingComments
        this.wordCountIncludingComments += other.wordCountIncludingComments
        this.charCountIncludingComments += other.charCountIncludingComments
        this.letterCountIncludingComments += other.letterCountIncludingComments
    }
}

export function activate(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

	const updateWordCount = () => {
        const editor = vscode.window.activeTextEditor;
		if (!editor) {
            statusBarItem.hide();
            return;
        }

        const text = editor.document.getText()
        const metrics = getMetrics(text)
        statusBarItem.text = metrics.messageShort
        statusBarItem.tooltip = metrics.messageLong
        statusBarItem.show()
    };

    vscode.window.onDidChangeActiveTextEditor(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateWordCount, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(updateWordCount, null, context.subscriptions);

    updateWordCount(); // initial call
}

function getMetrics(text: string): Metrics {
    const result = new Metrics()

    const lines = text.split('\n')
    for (const line of lines) {
        result.append(getMetricsForLine(line))
    }

    return result
}

function getMetricsForLine(line: string): Metrics {
    const result = new Metrics()

    const STRING_REGEX = /(.*#.*)?[>\+](?!=)[\t ]*(.*)/g;
	const matches : RegExpExecArray | null = STRING_REGEX.exec(line)
    if (matches == null) return result

    const isComment = matches[1] != null
    const str = matches[2]

    const TAG_REGEX = /(?<!\\)<([^<>]*?)(?<!\\)>/g
    const content = str.replace(TAG_REGEX, "")
    const words = content.split(/\s+/g).filter(Boolean)

    if (!isComment) {
        result.blockCount += 1
        result.wordCount += words.length
        result.charCount += content.length
        words.forEach(word => result.letterCount += word.replace(/[^A-Za-z0-9]/g, '').length)
    }

    result.blockCountIncludingComments += 1
    result.wordCountIncludingComments += words.length
    result.charCountIncludingComments += content.length
    words.forEach(word => result.letterCountIncludingComments += word.replace(/[^A-Za-z0-9]/g, '').length)

    return result
}

export function deactivate() {}
