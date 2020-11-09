import { Hash } from 'crypto';
import { App, MarkdownPreviewView, Modal, Notice, Plugin, PluginSettingTab, Setting, ValueComponent } from 'obsidian';

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

		this.addSettingTab(new WorkbenchSettingTab(this.app, this));

		/*this.registerEvent(this.app.on('codemirror', (cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		})); */

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			if (this.settings.altClickType != "Nothing") {
				if (evt.altKey) {
					if ((evt.target.className === "internal-link") || (evt.target.className === "cm-hmd-internal-link")) {
						console.log("alt");
						this.altClick(evt);
					}
				}
			}
			if (this.settings.metaAltClickType != "Nothing") {
				if (evt.metaKey && evt.altKey) {
					console.log("click", evt);
					if ((evt.target.className.includes("CodeMirror-line")) || evt.target.className.includes("cm")) {
						console.log("meta+alt");
						this.metaAltClick(evt);
					}
				}
			}
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('Unloading the Workbench plugin.');
	}

	saveToWorkbench(theMaterial: string, saveAction: string) {
		let obsidianApp = this.app;

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
				let newNoteText = previousNoteText + "\n\n" + linePrefix + theMaterial;
				obsidianApp.vault.modify(workbenchNoteFile, newNoteText);
				new Notice("Added " + saveAction + " to the workbench.")
			});
		}
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
				console.log("The regexp is '" + blockRegExp);
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

	metaAltClick(someMouseEvent: Event) {
		console.log("Meta alt click");

		let obsidianApp = this.app;

		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let clickType = this.settings.metaAltClickType;

		let linkPrefix = "";

		if (clickType === "Embed") {
			linkPrefix = "!";
		}

		// TKTKTK gotta find a way to get the list item's parent line

		if ((someMouseEvent.target.className.includes("cm"))) {
			let lineText = someMouseEvent.target.parentNode.innerText;
		} else {
			let lineText = someMouseEvent.target.innerText;
		}
		console.log("The contents of the line are: " + lineText);

		if (lineText != "") {
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
	
			let newMaterial = linkPrefix + "[[" + noteLink + "#^" + lineBlockID + "]]";
			console.log(newMaterial);
			this.saveToWorkbench(newMaterial, "a link to the selected block");
		} else {
			new Notice("There is nothing on the selected line.");
		}
		

	}

	linkNoteInWorkbench() { // Saves a link to the current note to the workbench
		let obsidianApp = this.app;

		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);
		
		
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
		let lineText = editor.getLine(cursor.line);
	
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
		let lineText = editor.getLine(cursor.line);
	
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
		let cm = currentView.sourceMode.cmEditor;
		var cursor = cm.getCursor();
		let lineText = cm.getLine(cursor.line);
		console.log(lineText);

		let newMaterial = lineText;
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a copy of the current block");
	}

}

class WorkbenchSettings {
	workbenchNoteName = "Workbench";
	workbenchLinePrefix = "";
	altClickType = "link";
	metaAltClickType = "block";
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
			.setName('Alt+Click type')
			.setDesc('Set what happens when you alt+click on a link. Default is to copy the link into the Workbench.')
			.addDropdown(dropDown =>
				dropDown
					.addOption("Link", "Link")
					.addOption("Embed", "Embed")
					.addOption("Nothing", "Nothing")
					.setValue(plugin.settings.altClickType)
					.onChange((value: string) => {
						plugin.settings.altClickType = value;
						plugin.saveData(plugin.settings);
						this.display();
				}));
			
		new Setting(containerEl)
			.setName('Meta+Alt+Click type')
			.setDesc('Set what happens when you cmd/ctrl+alt+click on a line. Default is to link the line as a block into the Workbench.')
			.addDropdown(dropDown =>
				dropDown
					.addOption("Link", "Link")
					.addOption("Embed", "Embed")
					.addOption("Nothing", "Nothing")
					.setValue(plugin.settings.metaAltClickType)
					.onChange((value: string) => {
						plugin.settings.metaAltClickType = value;
						plugin.saveData(plugin.settings);
						this.display();
				}));
	}
}
