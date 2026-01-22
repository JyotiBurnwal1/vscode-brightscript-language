import * as vscode from 'vscode';
import { PerfettoControls } from 'roku-debug';
import * as fsExtra from 'fs-extra';

export class PerfettoControlCommands {

    private getHost!: () => Promise<string>;

    public registerPerfettoControlCommands(
        context: vscode.ExtensionContext,
        getHost: () => Promise<string>
    ) {
        this.getHost = getHost;

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.startTracing',
                async () => {
                    const host = await this.getHost();
                    const perfettoController = new PerfettoControls(host);

                    fsExtra.ensureDirSync('perfetto');
                    await perfettoController.startTracing();

                    await vscode.commands.executeCommand(
                        'setContext',
                        'brightscript.tracingActive',
                        true
                    );
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.stopTracing',
                async () => {
                    const host = await this.getHost();
                    const perfettoController = new PerfettoControls(host);

                    await perfettoController.stopTracing();

                    await vscode.commands.executeCommand(
                        'setContext',
                        'brightscript.tracingActive',
                        false
                    );

                    this.openInBrowser('https://ui.perfetto.dev/#!');
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.enableTracing',
                async () => {
                    const host = await this.getHost();
                    const perfettoController = new PerfettoControls(host);

                    await perfettoController.enableTracing();
                }
            )
        );
    }

    private openInBrowser(weblink: string): void {
        vscode.env.openExternal(vscode.Uri.parse(weblink));
    }
}

export const perfettoControlCommands = new PerfettoControlCommands();
