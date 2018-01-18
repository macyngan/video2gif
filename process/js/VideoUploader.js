import React from 'react'
import ReactDOM from 'react-dom'
let {exec} = eRequire('child_process')

class VideoUploader extends React.Component {
    constructor(props) {
        super(props)
        this.probeVideoValid = this.probeVideoValid.bind(this)
    }

    componentDidMount(){
        let that = this
        let dropzone = document.getElementById('dropzone-border')

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault()
            e.stopPropagation()
            let file
            for (let f of e.dataTransfer.files) {
                file = f.path
            }
            that.probeVideoValid(file)
        })

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })

        dropzone.addEventListener('dragenter', (e) => {
            document.getElementById('dropzone-border').style.backgroundColor = '#98C2F4'
        })

        dropzone.addEventListener('dragleave', (e) => {
            document.getElementById('dropzone-border').style.backgroundColor = '#589AF8'
        })

        let openDialog = document.getElementById('openDialog')

        openDialog.addEventListener('click', (event) => {
            ipcRenderer.send('open-dialog')
        })

        ipcRenderer.on('selected-directory', (event, path) => {
            that.probeVideoValid(path[0])
        })
    }

    probeVideoValid(path) {
        let that = this

        // check file extension
        let pathSegments = path.split(".")
        let format = pathSegments[pathSegments.length-1].toLowerCase()

        // get filename
        let filenameSegments = path.split("/")
        let filename = filenameSegments[filenameSegments.length-1].toLowerCase()

        if(['mov','mp4','3pg','flv'].indexOf(format) == -1) {

        }else{
            let cmd = CONFIG.repositoryRootPath + '/bin/ffmpeg/ffprobe -hide_banner -show_streams '
                        + path +' -print_format json'

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    return
                }

                let data = JSON.parse(stdout)

                let videoDetails = {
                    name: filename,
                    format: format,
                    width: data.streams[0].width || null,
                    height: data.streams[0].height || null,
                    duration: data.streams[0].duration,
                    codecType: data.streams[0].codec_type
                }

                let convertOption = {
                    startTime: Math.round(data.streams[0].start_time),
                    endTime: Math.round(data.streams[0].duration),
                    videoOutputPath: CONFIG.repositoryRootPath + '/output/output.gif'
                }

                that.props.updateVideoDetail(videoDetails)
                that.props.updateConvertOption(convertOption)
                that.props.uploadedVideo(path)
            })
        }
    }

    render() {
        return(
            <div>
                <div id="dropzone">
                    <div id="dropzone-border">
                        <p className="uploadInstruction">
                            <a href="#" id="openDialog">
                                <strong>Choose a video</strong>
                            </a> or drag it here
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = VideoUploader



