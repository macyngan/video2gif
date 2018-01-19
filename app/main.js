const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const url = require('url')

app.on('ready', () => {
    let appWindow = new BrowserWindow({
        show: false,
        width: 1000,
        minWidth: 1000,
        height: 900,
        icon: path.join(__dirname, '../icons/icon.png'),
        webPreferences: {
            webSecurity: false,
            plugins: true
        }
    })

    appWindow.loadURL('file://' + __dirname + '/index.html')

    appWindow.once('ready-to-show', () => {
        appWindow.show()
        //appWindow.openDevTools()
    })

    appWindow.on('close', ()=>{
        app.exit()
    })

    ipcMain.on('open-dialog', (event) => {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, (files) => {
            if (files) event.sender.send('selected-directory', files)
        })
    })

    ipcMain.on('save-dialog', (event) => {
        const options = {
            title: 'Save Output Gif',
            filters: [
                { name: 'Images', extensions: ['gif'] }
            ]
        }
        dialog.showSaveDialog(options, (filename) => {
            event.sender.send('saved-file', filename)
        })
    })

    ipcMain.on('open-image', (event, path)=>{
        appWindow.previewFile(path)
    })
})
