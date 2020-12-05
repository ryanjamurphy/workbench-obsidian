import { Hash } from 'crypto';
import { App, MarkdownPreviewView, Notice, Plugin, PluginSettingTab, Setting, ToggleComponent, FuzzySuggestModal, SuggestModal, TFile } from 'obsidian';

export default class WorkbenchPlugin extends Plugin {
	settings: WorkbenchSettings;

	async onload() {
		console.log('Loading the Workbench plugin.');
		
		//load data from saved settings
		this.settings = (await this.loadData()) || new WorkbenchSettings();


		this.addRibbonIcon('pencil', 'Workbench', () => {
			let obsidianApp = this.app;
			let workbenchNoteTitle = this.settings.workbenchNoteName;

			let files = obsidianApp.vault.getFiles();
				const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
					|| e.path === workbenchNoteTitle
					|| e.basename === workbenchNoteTitle
				)[0];

			obsidianApp.workspace.openLinkText(workbenchNoteTitle, workbenchNoteFile.path, true, MarkdownPreviewView);
		});

		this.addCommand({
			id: 'workbench-link-current-note',
			name: 'Link the current note/page in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.linkNoteInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-embed-current-note',
			name: 'Embed the current note/page in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.embedNoteInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-link-current-block',
			name: 'Link the current line/block in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.linkBlockInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-embed-current-block',
			name: 'Embed the current line/block into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.embedBlockInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-copy-current-block',
			name: 'Copy the current line/block into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.copyBlockIntoWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-copy-and-link-current-block',
			name: 'Copy the current line/block into your Workbench as a markdown link to the line/block.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.copyLineAndLinkToBlock();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-link-current-section',
			name: 'Link the current heading/section into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.linkSectionInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-embed-current-section',
			name: 'Embed the current heading/section into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.embedSectionInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'clear-workbench',
			name: 'Clear the workbench note.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			callback: () => { 
				this.clearWorkbench();
			}
		});

		this.addCommand({ 
			id: 'insert-workbench',
			name: 'Insert the contents of the workbench note.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.insertWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'choose-new-workbench',
			name: 'Change your Workbench.',
			// callback: () => {
				// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.changeWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new WorkbenchSettingTab(this.app, this));

		/*this.registerEvent(this.app.on('codemirror', (cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		})); */

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			if (this.settings.altClickType != "Nothing") {
				if (evt.altKey) {
					if ((evt.target.className === "internal-link") || (evt.target.className.includes("cm-hmd-internal-link"))) {
						console.log("alt");
						this.altClick(evt);
					}
				}
			}
			if (this.settings.metaAltClickType != "Nothing") {
				if (evt.metaKey && evt.altKey) {
					if ((evt.target.className.includes("cm-hmd-internal-link"))) {
						new Notice("Sorry, this doesn't work when you click directly on a link. Try clicking outside of the link!");
					} else if ((evt.target.className.includes("CodeMirror-line")) || evt.target.className.includes("cm")) {
						let currentFile = this.app.workspace.activeLeaf.view.file;
						console.log("meta+alt");
						this.metaAltClick(evt, currentFile);
					}
				}
			}
		});
	}

	onunload() {
		console.log('Unloading the Workbench plugin.');
	}

	insertWorkbench() {
		let obsidianApp = this.app;
		let workbenchNoteTitle = this.settings.workbenchNoteName;
		let files = obsidianApp.vault.getFiles();
			const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
				|| e.path === workbenchNoteTitle
				|| e.basename === workbenchNoteTitle
			)[0];
		
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;

		let editor = obsidianApp.workspace.activeLeaf.view.sourceMode.cmEditor;
		let cursor = editor.getCursor();
		console.log(cursor);
		let doc = editor.getDoc();

		obsidianApp.vault.read(workbenchNoteFile).then(function (result) {
			doc.replaceRange(result, cursor);
			editor.focus();
		});
	}

	clearWorkbench() {
		let obsidianApp = this.app;
		let workbenchNoteTitle = this.settings.workbenchNoteName;
		let editor = obsidianApp.workspace.activeLeaf.view.sourceMode.cmEditor;
		let cursor = editor.getCursor();
		let files = obsidianApp.vault.getFiles();
			const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
				|| e.path === workbenchNoteTitle
				|| e.basename === workbenchNoteTitle
			)[0];

		obsidianApp.vault.modify(workbenchNoteFile, "");
		editor.setCursor(cursor);
		editor.focus();
	}

	saveToWorkbench(theMaterial: string, saveAction: string) {
		let obsidianApp = this.app;
		let editor = obsidianApp.workspace.activeLeaf.view.sourceMode.cmEditor;
		let cursor = editor.getCursor();
		let blankLine = this.settings.includeBlankLine;

		let linePrefix = this.settings.workbenchLinePrefix;

		console.log(linePrefix + theMaterial);

		let workbenchNoteTitle = this.settings.workbenchNoteName;

		let files = obsidianApp.vault.getFiles();
			const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
				|| e.path === workbenchNoteTitle
				|| e.basename === workbenchNoteTitle
			)[0];

		console.log("Workbench note:" + workbenchNoteFile);

		if (!workbenchNoteFile) {
			console.log("The workbench note does not already exist. Creating it, then appending the new content to it.");

			let noteText = linePrefix + theMaterial;
			let newWorkbenchFile = obsidianApp.vault.create(workbenchNoteTitle + ".md", noteText);
		} else { // The file exists 
			console.log("The workbench note already exists. Appending the new content to it.");
			let previousNoteText = "";
			obsidianApp.vault.read(workbenchNoteFile).then(function (result) {
				let previousNoteText = result;
				//console.log("Previous note text:\n" + previousNoteText);
				let lineSpacing = "\n";
				if (blankLine) {
					lineSpacing = "\n\n";
				}
				let newNoteText = previousNoteText + lineSpacing + linePrefix + theMaterial;
				obsidianApp.vault.modify(workbenchNoteFile, newNoteText);
				new Notice("Added " + saveAction + " to the workbench.")
			});
		}
		editor.setCursor(cursor);
		editor.focus();
	}

	createBlockHash(inputText: string): string { // Credit to https://stackoverflow.com/a/1349426
			let obsidianApp = this.app;

			let result = '';
			var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
			var charactersLength = characters.length;
			for ( var i = 0; i < 7; i++ ) {
			   result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
			return result;
	}

	getBlock(inputLine: string, noteFile: object): string { //Returns the string of a block ID if block is found, or "" if not.
		let obsidianApp = this.app;
		let noteBlocks = obsidianApp.metadataCache.getFileCache(noteFile).blocks;
		console.log("Checking if line '" + inputLine + "' is a block.");
		let blockString = "";
		if (noteBlocks) { // the file does contain blocks. If not, return ""
			for (let eachBlock in noteBlocks) { // iterate through the blocks. 
				console.log("Checking block ^" + eachBlock);
				let blockRegExp = new RegExp("(" + eachBlock + ")$", "gim");
				if (inputLine.match(blockRegExp)) { // if end of inputLine matches block, return it
					blockString = eachBlock;
					console.log("Found block ^" + blockString);
					return blockString;
				} 
			}
			return blockString;
		} 
		return blockString;
	}

	altClick(someMouseEvent: Event) {
		let obsidianApp = this.app;

		let clickType = this.settings.altClickType;

		let linkPrefix = "";
		if (clickType === "Embed") {
			linkPrefix = "!";
		}

		let newMaterial = linkPrefix + "[[" + someMouseEvent.target.innerText + "]]";
		this.saveToWorkbench(newMaterial, "a link to the selected note");
	}

	metaAltClick(someMouseEvent: Event, activeFile: object) {
		console.log("Meta alt click");

		let obsidianApp = this.app;

		let lineText = someMouseEvent.target.innerText;

		if ((someMouseEvent.target.className.includes("cm"))) {
			lineText = someMouseEvent.target.parentNode.innerText;
		}

		console.log("The contents of the line are: " + lineText);

		// Get the file and create a link to it
		let currentNoteFile = activeFile;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let clickType = this.settings.metaAltClickType;

		if (lineText != "") {

			if (clickType === "Copy") {
				let newMaterial = lineText;
				this.saveToWorkbench(newMaterial, "a copy of the selected line/block");
			} else {
				let linkPrefix = "";

				if (clickType === "Embed") {
					linkPrefix = "!";
				}

				console.log("Checking for block:");
				if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
					lineText = lineText.trim();
					console.log("This line is not currently a block. Adding a block ID.");
					lineBlockID = this.createBlockHash(lineText).toString();
					let lineWithBlock = lineText + " ^" + lineBlockID;
					obsidianApp.vault.read(currentNoteFile).then(function (result) {
						let previousNoteText = result;
						let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
						obsidianApp.vault.modify(currentNoteFile, newNoteText);
					})
				} else {
					let lineBlockID = this.getBlock(lineText, currentNoteFile);
					console.log(lineBlockID);
				}
		
				let newMaterial = linkPrefix + "[[" + noteLink + "#^" + lineBlockID + "]]";
				console.log(newMaterial);
				this.saveToWorkbench(newMaterial, "a link to the selected line/block");
			} 
		} else {
			new Notice("There is nothing on the selected line.");
		}
	}

	linkNoteInWorkbench() { // Saves a link to the current note to the workbench
		let obsidianApp = this.app;
		let currentView = obsidianApp.workspace.activeLeaf.view;
		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);
		let editor = currentView.sourceMode.cmEditor;
		
		let newMaterial = "[[" + noteLink + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current note");
	}

	embedNoteInWorkbench() { // Saves an embed of the current note to the workbench
		let obsidianApp = this.app;
		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);
		
		let newMaterial = "![[" + noteLink + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "an embed of the current note");
	}

	linkSectionInWorkbench() { // Saves a link to the current heading to the workbench
		let obsidianApp = this.app;

		// get the heading
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
	
		let currentLine = editor.doc.sel.ranges[0].anchor.line;

		// Stuck here. For some reason the action only works once on some sections tktktk

		let headings = obsidianApp.metadataCache.getFileCache(currentNoteFile).headings;
		let sectionHeading;
		console.log(headings);
		if (!headings) { 
			new Notice("No headings found in the current document.");
			return;
		} else { // check what heading is closest above the current line
			for (let eachHeading of headings) {
				let headingLineNumber = eachHeading.position.start.line;
				if (headingLineNumber == currentLine) {
					sectionHeading = eachHeading;
					break;
				} else if (headingLineNumber > currentLine) {
					break;
				}
			sectionHeading = eachHeading;
			}
		}

		
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "[[" + noteLink + "#" + sectionHeading.heading + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current section");
	}

	embedSectionInWorkbench() { // Saves an embed of the current heading to the workbench
		let obsidianApp = this.app;

		// get the heading
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
	
		let currentLine = editor.doc.sel.ranges[0].anchor.line;

		// Stuck here. For some reason the action only works once on some sections tktktk

		let headings = obsidianApp.metadataCache.getFileCache(currentNoteFile).headings;
		let sectionHeading;
		console.log(headings);
		if (!headings) { 
			new Notice("No headings found in the current document.");
			return;
		} else { // check what heading is closest above the current line
			for (let eachHeading of headings) {
				let headingLineNumber = eachHeading.position.start.line;
				if (headingLineNumber == currentLine) {
					sectionHeading = eachHeading;
					break;
				} else if (headingLineNumber > currentLine) {
					break;
				}
			sectionHeading = eachHeading;
			}
		}

		
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "![[" + noteLink + "#" + sectionHeading.heading + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current section");
	}

	linkBlockInWorkbench() { // Links the current block to the workbench
		let obsidianApp = this.app;

		// get the block
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		console.log("Checking for block:");
		let lineBlockID = this.getBlock(lineText, currentNoteFile);
		console.log(lineBlockID);

		if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
			console.log("This line is not currently a block. Adding a block ID.");
			lineBlockID = this.createBlockHash(lineText).toString();
			let lineWithBlock = lineText + " ^" + lineBlockID;
			obsidianApp.vault.read(currentNoteFile).then(function (result) {
				let previousNoteText = result;
				let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
				obsidianApp.vault.modify(currentNoteFile, newNoteText);
			})
		}

		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "[[" + noteLink + "#^" + lineBlockID + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current block");
	}

	embedBlockInWorkbench() { // Saves an embed of the current block to the workbench
		let obsidianApp = this.app;

		// get the block
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		console.log("Checking for block:");
		let lineBlockID = this.getBlock(lineText, currentNoteFile);
		console.log(lineBlockID);

		if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
			console.log("This line is not currently a block. Adding a block ID.");
			lineBlockID = this.createBlockHash(lineText).toString();
			let lineWithBlock = lineText + " ^" + lineBlockID;
			obsidianApp.vault.read(currentNoteFile).then(function (result) {
				let previousNoteText = result;
				let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
				obsidianApp.vault.modify(currentNoteFile, newNoteText);
			})
		}

		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "![[" + noteLink + "#^" + lineBlockID + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current block");
	}

	copyBlockIntoWorkbench() { // Copies the content of the current block to the workbench
		let obsidianApp = this.app;

		let currentView = obsidianApp.workspace.activeLeaf.view;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		let newMaterial = lineText;
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a copy of the current block");
	}

	copyLineAndLinkToBlock() { // Copies the content of the current block to the workbench
		let obsidianApp = this.app;

		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		//trim block text tktktk

		let blockIDRegex = new RegExp("/(\s){0,1}[\^]{1}([a-zA-Z0-9\-]+)$/", "gim");

		let lineTextWithoutBlockID = lineText.replace(blockIDRegex, "");

		console.log("Checking for block:");
		let lineBlockID = this.getBlock(lineText, currentNoteFile);
		console.log(lineBlockID);

		if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
			console.log("This line is not currently a block. Adding a block ID.");
			lineBlockID = this.createBlockHash(lineText).toString();
			let lineWithBlock = lineText + " ^" + lineBlockID;
			obsidianApp.vault.read(currentNoteFile).then(function (result) {
				let previousNoteText = result;
				let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
				obsidianApp.vault.modify(currentNoteFile, newNoteText);
			})
		}

		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let encodedNoteLink = encodeURIComponent(noteLink);

		let newMaterial = "[" + lineTextWithoutBlockID + "]" + "(" + encodedNoteLink + "#^" + lineBlockID + ")";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a linked copy of the current block");
	}

	changeWorkbench() {
		let obsidianApp = this.app;

		new workbenchNameModal(obsidianApp).open();
	}

}

class workbenchNameModal extends FuzzySuggestModal<string> { // thanks to Licat for the assist!
	app: App;

    constructor(app: App) {
        super(app);
		this.app = app;
    }

    getItems(): string[] {
		let files = this.app.vault.getMarkdownFiles();
		let fileList = files.map(file => file.name);
        return fileList;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		let workbenchPlugin = this.app.plugins.getPlugin("workbench-obsidian");
		workbenchPlugin.settings.workbenchNoteName = item;
		workbenchPlugin.saveData(workbenchPlugin.settings);
		new Notice("Your workbench is now " + item);
    }
}

class WorkbenchSettings {
	workbenchNoteName = "Workbench";
	workbenchLinePrefix = "";
	altClickType = "Link";
	metaAltClickType = "Embed";
	includeBlankLine = false;
}

class WorkbenchSettingTab extends PluginSettingTab {
	display(): void {
		let {containerEl} = this;
		const plugin: any = (this as any).plugin;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Workbench Settings'});

		new Setting(containerEl)
			.setName('Workbench note name')
			.setDesc('Provide a title for the workbench note. Default is Workbench.')
			.addText(text => 
				text
					.setPlaceholder('Workbench')
					.setValue(plugin.settings.workbenchNoteName)
					.onChange((value) => {
						plugin.settings.workbenchNoteName = value;
						plugin.saveData(plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Workbench line prefix')
			.setDesc('Set the prefix to each line added to Workbench. Default is nothing.')
			.addText(text => 
				text
					.setPlaceholder('')
					.setValue(plugin.settings.workbenchLinePrefix)
					.onChange((value) => {
						plugin.settings.workbenchLinePrefix = value;
						plugin.saveData(plugin.settings);
				}));
		
		new Setting(containerEl)
			.setName('Blank lines')
			.setDesc('Toggle whether there should be a blank line between each Workbench entry.')
			.addToggle((toggle) => {
				toggle.setValue(plugin.settings.includeBlankLine);
				toggle.onChange(async (value) => {
					plugin.settings.includeBlankLine = value;
					console.log("Include blank lines between entries:" + value);
				  	plugin.saveData(plugin.settings);
				});
			});

		new Setting(containerEl)
			.setName('Alt+Click type')
			.setDesc('Set what happens when you alt+click on a link. Default is to copy the link into the Workbench. Note: if your cursor is not already on the targeted line, you may need to double-click!')
			.addDropdown(dropDown =>
				dropDown
					.addOption("Link", "Link selected note in Workbench")
					.addOption("Embed", "Embed selected note in Workbench")
					.addOption("Nothing", "Nothing")
					.setValue(plugin.settings.altClickType)
					.onChange((value: string) => {
						plugin.settings.altClickType = value;
						plugin.saveData(plugin.settings);
						this.display();
				}));
			
		new Setting(containerEl)
			.setName('Meta+Alt+Click type')
			.setDesc('Set what happens when you cmd/ctrl+alt+click on a line. Default is to link the line as a block into the Workbench. Note: if your cursor is not already on the targeted line, you may need to double-click!')
			.addDropdown(dropDown =>
				dropDown
					.addOption("Link", "Link block")
					.addOption("Embed", "Embed block")
					.addOption("Copy", "Copy line")
					.addOption("Nothing", "Nothing")
					.setValue(plugin.settings.metaAltClickType)
					.onChange((value: string) => {
						plugin.settings.metaAltClickType = value;
						plugin.saveData(plugin.settings);
						this.display();
				}));
	}
}
