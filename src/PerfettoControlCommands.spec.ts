import { expect } from 'chai';
import * as vscode from 'vscode';
import * as fsExtra from 'fs-extra';
import * as sinon from 'sinon';
import { PerfettoControls } from 'roku-debug';
import { PerfettoControlCommands } from './PerfettoControlCommands';

describe('PerfettoControlCommands', () => {
    let context: vscode.ExtensionContext;
    let getHost: sinon.SinonStub;

    beforeEach(() => {
        context = { subscriptions: [] } as any;
        getHost = sinon.stub().resolves('127.0.0.1');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('registers all perfetto commands', () => {
        const registerStub = sinon.stub(vscode.commands, 'registerCommand');

        const commands = new PerfettoControlCommands();
        commands.registerPerfettoControlCommands(context, getHost);

        expect(registerStub.callCount).to.equal(3);
        expect(context.subscriptions.length).to.equal(3);
    });

    it('startTracing command starts tracing and sets context', async () => {
        sinon.stub(fsExtra, 'ensureDirSync');
        sinon.stub(vscode.commands, 'executeCommand');

        const startStub = sinon.stub(
            PerfettoControls.prototype,
            'startTracing'
        ).resolves();

        let startHandler: Function | undefined;

        sinon.stub(vscode.commands, 'registerCommand')
            .callsFake((cmd, cb) => {
                if (cmd === 'extension.brightscript.startTracing') {
                    startHandler = cb;
                }
                return {} as any;
            });

        const commands = new PerfettoControlCommands();
        commands.registerPerfettoControlCommands({ subscriptions: [] } as any, async () => '127.0.0.1');

        await startHandler!();

        expect(startStub.calledOnce).to.be.true;
    });

});
