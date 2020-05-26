import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Terminator - ONLINE');

	let editProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			console.log('Terminator - EXECUTE: format');

			let textEditList = [];

			let terminators = [';', '{', '}'];
			let indentSize = 4;

			function escapeRegExp(text: string) {
				return text.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
			}

			let terminatorsRegex = '';
			for (let i = 0; i < terminators.length; i++) {
				const terminator = terminators[i];
				terminatorsRegex += escapeRegExp(terminator);
			}
			terminatorsRegex = '[' + terminatorsRegex + ']';

			// Remove line with only terminators
			for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
				const line = document.lineAt(lineIndex);
				if (line && line.text) {
					let match = line.text.match(new RegExp('(\\s*)(' + terminatorsRegex + ')'));
					if (match && match[1]) {
						// If possible remove newline
						let previousLine;
						if (lineIndex > 0) {
							previousLine = document.lineAt(lineIndex - 1);
						}
						if (previousLine && previousLine.text) {
							textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex - 1, previousLine.text.length, lineIndex, match[1].length)));
						} else {
							textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex, 0, lineIndex, match[1].length)));
						}
					}
				}
			}

			return textEditList;
		}
	};

	vscode.languages.registerDocumentFormattingEditProvider('csharp', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('javascript', editProvider);
}