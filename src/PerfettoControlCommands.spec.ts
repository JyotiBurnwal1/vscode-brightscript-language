// import * as sinon from 'sinon';
// import * as vscode from 'vscode';
// import { PerfettoControlCommands } from "./PerfettoControlCommands"

// describe('PerfettoControlCommands', () => {
//   afterEach(() => {
//     sinon.restore();
//   });

//   it('registers start and stop tracing commands', () => {
//     const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
//     const registerEditorStub = sinon.stub(vscode.window, 'registerCustomEditorProvider');

//     const context: any = {
//       subscriptions: [],
//     };

//     const cmds = new PerfettoControlCommands();
//     cmds.registerPerfettoControlCommands(context);

//     sinon.assert.calledWith(
//       registerCommandStub,
//       'extension.brightscript.startTracing',
//       sinon.match.func
//     );

//     sinon.assert.calledWith(
//       registerCommandStub,
//       'extension.brightscript.stopTracing',
//       sinon.match.func
//     );

//     sinon.assert.calledOnce(registerEditorStub);
//   });

//   it('handleTracingOperation shows success message', async () => {
//     const infoStub = sinon.stub(vscode.window, 'showInformationMessage');
//     const errorStub = sinon.stub(vscode.window, 'showErrorMessage');

//     const cmds = new PerfettoControlCommands();

//     await (cmds as any).handleTracingOperation(
//       'Start',
//       async () => ({ message: 'ok', error: false })
//     );

//     sinon.assert.calledWith(infoStub, 'Starting perfetto Tracing!');
//     sinon.assert.calledWith(infoStub, 'Perfetto tracing started: ok');
//     sinon.assert.notCalled(errorStub);
//   });

//   it('handleTracingOperation shows error message on failure', async () => {
    
//     const errorStub = sinon.stub(vscode.window, 'showErrorMessage');

//     const cmds = new PerfettoControlCommands();

//     await (cmds as any).handleTracingOperation(
//       'Stop',
//       async () => ({ message: 'failed', error: true })
//     );

//     sinon.assert.calledWith(
//       errorStub,
//       'Error stoping perfetto tracing: failed'
//     );
//   });

//   it('createFolderIfNotExists creates folder when workspace exists', async () => {
//     sinon.stub(vscode.workspace, 'workspaceFolders').value([
//       { uri: vscode.Uri.file('/workspace') },
//     ]);

//     const createDirStub = sinon
//       .stub(vscode.workspace.fs, 'createDirectory')
//       .resolves();

//     const cmds = new PerfettoControlCommands();
//     const uri = await (cmds as any).createFolderIfNotExists('perfetto');

//     sinon.assert.calledOnce(createDirStub);
//     sinon.assert.match(uri.fsPath, /perfetto$/);
//   });

//   it('createFolderIfNotExists throws error when no workspace folder exists', async () => {
//     sinon.stub(vscode.workspace, 'workspaceFolders').value([]);
//     const errorStub = sinon.stub(vscode.window, 'showErrorMessage');

//     const cmds = new PerfettoControlCommands();

//     try {
//       await (cmds as any).createFolderIfNotExists('perfetto');
//       throw new Error('Expected error to be thrown');
//     } catch (err: any) {
//       sinon.assert.calledOnce(errorStub);
//       sinon.assert.match(err.message, 'No workspace folder found.');
//     }
//   });

//   it('getRemoteHost uses stored host from workspaceState', async () => {
//     const context: any = {
//       workspaceState: {
//         get: sinon.stub().resolves('192.168.1.10'),
//         update: sinon.stub().resolves(),
//       },
//     };

//     const cmds = new PerfettoControlCommands();
//     (cmds as any).context = context;

//     await cmds.getRemoteHost();

//     sinon.assert.calledWith(context.workspaceState.get, 'remoteHost');
//     sinon.assert.calledWith(
//       context.workspaceState.update,
//       'remoteHost',
//       '192.168.1.10'
//     );
//   });
// });
