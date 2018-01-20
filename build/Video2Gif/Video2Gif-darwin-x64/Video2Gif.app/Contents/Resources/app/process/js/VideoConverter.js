import React from 'react'
import ReactDOM from 'react-dom'
const {exec} = eRequire('child_process')

class VideoConverter extends React.Component {
    constructor(props) {
        super(props)

        this.updateTimeStamp = this.updateTimeStamp.bind(this)
        this.updateConvertWidth = this.updateConvertWidth.bind(this)
        this.changingOutputPath = this.changingOutputPath.bind(this)
        this.convertVideo = this.convertVideo.bind(this)

        this.state = {
            isConverting: false,
            errMsg: ""
        }
    }

    componentDidMount(){
        let inputVideo = document.getElementById("inputVideo")
        inputVideo.addEventListener('timeupdate', ()=>{
            inputVideo.setAttribute("controls","controls")
        })

        let previewVideo = document.getElementById("preview")
        previewVideo.addEventListener('timeupdate', ()=>{
            if(this.props.convertOption.startTime < this.props.convertOption.endTime) {
                /*
                  when start time comes before end time (valid condition):
                  clear error message, enable convert button, display preview duration
                  adjust current time if it fall out duration range
                */

                if(this.refs.convertErrMsg)
                    this.setState({errMsg: ""})

                if(document.getElementById("convertBtn"))
                    document.getElementById("convertBtn").disabled = false

                let duration = this.props.convertOption.endTime - this.props.convertOption.startTime

                if(document.getElementById("previewDuration")) {
                    let durationHTML = "<div>Duration: " + Math.trunc(duration) +  " sec(s)</div>"
                    document.getElementById("previewDuration").innerHTML = durationHTML
                }

                if(previewVideo.currentTime < this.props.convertOption.startTime
                    || previewVideo.currentTime > this.props.convertOption.endTime) {
                    previewVideo.currentTime = this.props.convertOption.startTime
                }
            }else{
                /*
                  when start time greater or equals end time (invalid condition):
                  display invalid duration under preview, set error message,
                  disable convert button
                */
                if(document.getElementById("previewDuration"))
                    document.getElementById("previewDuration").innerHTML = "<div>Invalid Duration</div>"

                if(this.refs.convertErrMsg)
                    this.setState({errMsg: "Start Time can only comes before End Time"})

                if(document.getElementById("convertBtn"))
                    document.getElementById("convertBtn").disabled = true
            }
        })

        let self = this
        ipcRenderer.on('saved-file', (event, path) => {
            if (!path) {
                path = ""
            } else {
                self.props.updateConvertOption({videoOutputPath: path})
            }
        })
    }

    updateTimeStamp(event) {
        let vid = document.getElementById("inputVideo")
        let newTime = Math.trunc(event.target.value)

        switch(event.target.id) {
            case "startTimeInput":
                this.props.updateConvertOption({startTime: newTime})
                break
            case "startTimeButton":
                this.props.updateConvertOption({startTime: Math.trunc(vid.currentTime)})
                break
            case "endTimeInput":
                this.props.updateConvertOption({endTime: newTime})
                break
            case "endTimeButton":
                this.props.updateConvertOption({endTime: Math.trunc(vid.currentTime)})
                break
        }
    }

    updateConvertWidth(event) {
        this.props.updateConvertOption({widthLimit: event.target.value})
    }

    changingOutputPath() {
        ipcRenderer.send('save-dialog')
    }

    convertVideo() {

        // no need to scale if using original
        let scale = this.props.convertOption.widthLimit === 'original' ?
                        "": "-vf scale="+parseInt(this.props.convertOption.widthLimit)+":-1 "

        let duration = this.props.convertOption.endTime - this.props.convertOption.startTime

        // -ss: start time, -t: duration
        let cutting = "-ss " + this.props.convertOption.startTime + " -t " + duration

        /*
         escape space and special character for input and output path
         before using it in ffmpeg command
        */
        let inputPathEscaped = this.props.videoInputPath.replace(/[\[\]\{\}\" "\(\)\*\?\^\$\|]/g, "\\$&")
        let outputPathEscaped = this.props.convertOption.videoOutputPath.replace(/[\[\]\{\}\" "\(\)\*\?\^\$\|]/g, "\\$&")

        let cmd = CONFIG.repositoryRootPath + '/bin/ffmpeg/ffmpeg ' + cutting + ' -i '
                    + inputPathEscaped + ' -r 24 ' + scale + '-y '
                    + outputPathEscaped

        this.setState({
            isConverting: true
        })

        let ls = exec(cmd)

        // send desktop notification when finished, user click will open gif in Quick Look
        ls.on('close', (code) => {
            this.setState({
                isConverting: false
            })

            let imagePath = this.props.convertOption.videoOutputPath

            const notification = {
                title: 'Your Gif is Ready!',
                body: `Image saved to ${this.props.convertOption.videoOutputPath}`,
                icon: `${CONFIG.repositoryRootPath}/app/images/openFileIcon.png`
            }

            const doneNotification = new window.Notification(notification.title, notification)

            doneNotification.onclick = () => {
                ipcRenderer.send('open-image', imagePath)
            }
        })
    }

    render() {
        let loadingOverlay = null

        // display loader while converting
        if(this.state.isConverting) {
            loadingOverlay =
                <div className="overlay">
                    <img className="loader"
                         src={CONFIG.repositoryRootPath + "/app/images/Pacman.gif"}
                         alt="Converting..."/>
                    <div className="loader-text">Converting, please be patient ... </div>
                </div>
        }

        return(
            <div>
                <div className="errMsg" ref="convertErrMsg">{this.state.errMsg}</div>
                <div className="inputSection">
                    <h4>Input Video</h4>
                    <div className="videoInfoGroup">
                        {this.props.videoDetail.name}
                        <span className="videoInfoDivider">|</span>
                        {this.props.videoDetail.width}x{this.props.videoDetail.height}
                    </div>

                    <div className="flex-container">
                        <div>
                            <video id="inputVideo" width="600" controls>
                                <source src={this.props.videoInputPath} type="video/mp4"/>
                                Your browser does not support HTML5 video.
                            </video>
                        </div>

                        <div className="convertConfig">
                            <div>
                                <div>Start Time (sec)</div>
                                <input id="startTimeInput"
                                       type="text"
                                       value={this.props.convertOption.startTime}
                                       onChange={this.updateTimeStamp}/>
                                <button id="startTimeButton"
                                        onClick={this.updateTimeStamp}>use current position</button>
                            </div>

                            <div>
                                <div>End Time (sec)</div>
                                <input id="endTimeInput"
                                       type="text"
                                       value={this.props.convertOption.endTime}
                                       onChange={this.updateTimeStamp}/>
                                <button id="endTimeButton"
                                        onClick={this.updateTimeStamp}>use current position</button>
                            </div>

                            <div className="outputWidth">
                                <div>Output Width</div>
                                <input type="radio"
                                       id="widthRadio1"
                                       name="widthRadios"
                                       value="original"
                                       checked={this.props.convertOption.widthLimit==="original"}
                                       onChange={this.updateConvertWidth}/>
                                <label htmlFor="widthRadio1">Original({this.props.videoDetail.width}px)</label>

                                <input type="radio"
                                       id="widthRadio2"
                                       name="widthRadios"
                                       value="1200"
                                       checked={this.props.convertOption.widthLimit==="1200"}
                                       onChange={this.updateConvertWidth}/>
                                <label htmlFor="widthRadio2">1200px</label>

                                <input type="radio"
                                       id="widthRadio3"
                                       name="widthRadios"
                                       value="1600"
                                       checked={this.props.convertOption.widthLimit==="1600"}
                                       onChange={this.updateConvertWidth}/>
                                <label htmlFor="widthRadio3">1600px</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-container">
                    <div className="gifPreview">
                        <h4>Output Gif Preview</h4>
                        <video id="preview" width="350" autoPlay loop muted>
                            <source src={this.props.videoInputPath} type="video/mp4"/>
                            Your browser does not support HTML5 video.
                        </video>
                        <div id="previewDuration"></div>
                    </div>

                    <div className="convertGroup">
                        <div className="outputLocation">
                            <div><strong>File save as after converting:</strong></div>
                            <div>{this.props.convertOption.videoOutputPath}</div>
                            <div className="changeOutputLocation">
                                <a href="#" onClick={this.changingOutputPath}>Change</a>
                            </div>
                        </div>
                        <div className="outputButton">
                            <button onClick={this.props.backToHomePage} className="backHome">
                                <i className="fa fa-arrow-left fa-lg" aria-hidden="true"></i>
                                Back
                            </button>
                            <button id="convertBtn" onClick={this.convertVideo}>
                                <i className="fa fa-refresh fa-lg" aria-hidden="true"></i>
                                Convert
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    {loadingOverlay}
                </div>

            </div>
        )
    }
}

module.exports = VideoConverter