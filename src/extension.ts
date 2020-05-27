import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Terminator - ONLINE');

	let editProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			console.log('Terminator - EXECUTE: format');

			let textEditList: vscode.TextEdit[] = [];

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

			// Get max indent ignoring terminator/whitespace
			let maxIndent = 0;
			for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
				const line: vscode.TextLine = document.lineAt(lineIndex);
				if (line && line.text) {
					let lineIndentMatch = line.text.match(new RegExp('(.*?)(\\s|' + terminatorsRegex + ')*$'));
					if (lineIndentMatch && lineIndentMatch.length > 2 && lineIndentMatch[1].length > maxIndent) {
						maxIndent = lineIndentMatch[1].length;
					}
				}
			}
			// Increment by 1 to indent after non terminator/whitespace stops
			maxIndent++;
			// Indent at indentSize intervals
			maxIndent += maxIndent % indentSize;
			// Offset
			maxIndent += indentSize;

			// TODO: handle terminators at start of line eg: "} else {"
			// TODO: handle whitespace after terminators
			for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
				const line: vscode.TextLine = document.lineAt(lineIndex);
				if (line && line.text) {
					let onlyTerminatorLineMatch = line.text.match(new RegExp('(^\\s*)(' + terminatorsRegex + ')+$'));
					if (onlyTerminatorLineMatch && onlyTerminatorLineMatch[1] != null) {
						// Line with terminator and whitespace only
						let previousLine;
						if (lineIndex > 0) {
							previousLine = document.lineAt(lineIndex - 1);
						}
						if (previousLine && previousLine.text) {
							// Add padding if previousLine doesn't end with a terminator
							if (!new RegExp(terminatorsRegex + '$').test(previousLine.text)) {
								let padding = ' '.repeat(maxIndent - previousLine.text.length);
								textEditList.push(vscode.TextEdit.insert(new vscode.Position(lineIndex - 1, previousLine.text.length), padding));
							}
							textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex - 1, previousLine.text.length, lineIndex, onlyTerminatorLineMatch[1].length)));
						} else {
							textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex, 0, lineIndex, onlyTerminatorLineMatch[1].length)));
						}
					} else {
						// Indent code with text and terminator
						let match = line.text.match(new RegExp('(.*?)(' + terminatorsRegex + '+)$'));
						if (match && match.length == 3 && match[1]) {
							let padding = ' '.repeat(maxIndent - match[1].length);
							textEditList.push(vscode.TextEdit.insert(new vscode.Position(line.lineNumber, match[1].length), padding));
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