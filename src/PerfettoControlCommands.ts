import * as vscode from 'vscode';
import { PerfettoManager } from 'roku-debug';

export class PerfettoControlCommands {

    private getHost!: () => Promise<string>;

    public async registerPerfettoControlCommands(
        context: vscode.ExtensionContext,
        getHost: () => Promise<string>
    ) {
        this.getHost = getHost;
        const host = await this.getHost();
        const perfettoController = new PerfettoManager(host);

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.startTracing',
                async () => {
                    let response = await perfettoController.startTracing();
                    if (response?.error) {
                        vscode.window.showErrorMessage(response.error);
                    } else {
                        await vscode.commands.executeCommand(
                            'setContext',
                            'brightscript.tracingActive',
                            true
                        );
                    }
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.stopTracing',
                async () => {
                    let response = await perfettoController.stopTracing();
                    if (response?.error) {
                        vscode.window.showErrorMessage(response.error);
                        return;
                    } else {
                        await vscode.commands.executeCommand(
                            'setContext',
                            'brightscript.tracingActive',
                            false
                        );
                    }
                    this.openInBrowser('https://ui.perfetto.dev/#!');
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.enableTracing',
                async () => {
                    let response = await perfettoController.enableTracing();
                    if (response?.error) {
                        vscode.window.showErrorMessage(response.error);
                    }
                }
            )
        );
    }

    private openInBrowser(weblink: string): void {
        vscode.env.openExternal(vscode.Uri.parse(weblink));
    }
}

export const perfettoControlCommands = new PerfettoControlCommands();
