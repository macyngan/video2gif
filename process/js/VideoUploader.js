import React from 'react'
import ReactDOM from 'react-dom'
let {exec} = eRequire('child_process')

class VideoUploader extends React.Component {
    constructor(props) {
        super(props)
        this.probeVideoValid = this.probeVideoValid.bind(this)

        this.state = {
            errMsg: ""
        }
    }

    componentDidMount(){
        let dropzone = document.getElementById('dropzone-border')

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault()
            e.stopPropagation()
            let file
            for (let f of e.dataTransfer.files) {
                file = f.path
            }
            this.probeVideoValid(file)
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
            self.probeVideoValid(path[0])
        })
    }

    probeVideoValid(path) {
        // check file extension
        let pathSegments = path.split(".")
        let format = pathSegments[pathSegments.length-1].toLowerCase()

        // get filename
        let filenameSegments = path.split("/")
        let filename = filenameSegments[filenameSegments.length-1].toLowerCase()

        if(['mov','mp4','3pg'].indexOf(format) == -1) {
            this.setState({
                errMsg: "Oops! We only accept MOV, MP4 or 3pg files"
            })
        }else{
            let cmd = CONFIG.repositoryRootPath + '/bin/ffmpeg/ffprobe -hide_banner -show_streams "'
                        + path +'" -print_format json'

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`)
                    this.setState({
                        errMsg: "Oops!" + error
                    })
                    return
                }

                let data = JSON.parse(stdout)

                if(data.streams[0].codec_type != 'video') {
                    this.setState({
                        errMsg: "Oops! We only accept video file"
                    })
                    return
                }

                let videoDetails = {
                    name: filename,
                    format: format,
                    width: data.streams[0].width || 0,
                    height: data.streams[0].height || 0,
                    duration: data.streams[0].duration || 0,
                    codecType: data.streams[0].codec_type
                }

                let convertOption = {
                    startTime: Math.trunc(data.streams[0].start_time) || 0,
                    endTime: Math.trunc(data.streams[0].duration) || 0,
                    videoOutputPath: `${pathSegments[0]}.gif`
                }

                this.props.updateVideoDetail(videoDetails)
                this.props.updateConvertOption(convertOption)
                this.props.uploadedVideo(path)
            })
        }
    }

    render() {
        return(
            <div>
                <div className="errMsg">{this.state.errMsg}</div>
                <div id="dropzone">
                    <div id="dropzone-border">
                        <p className="uploadInstruction">
                            <a href="#" id="openDialog">
                                <strong>Choose a video</strong>
                            </a> or drag it here
                        </p>
                        <p>Accepts MP4, MOV, 3pg files, one at a time</p>
                    </div>
                </div>
            </div>
        )
    }
}

module.exports = VideoUploader



