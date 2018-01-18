import React from 'react'
import ReactDOM from 'react-dom'
let {exec} = eRequire('child_process')

class VideoConverter extends React.Component {
    constructor(props) {
        super(props)

        this.updateTimeStamp = this.updateTimeStamp.bind(this)
        this.updateConvertWidth = this.updateConvertWidth.bind(this)
        this.changingOutputPath = this.changingOutputPath.bind(this)
        this.convertVideo = this.convertVideo.bind(this)

        this.state = {
            isConverting: false
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
                let duration = this.props.convertOption.endTime - this.props.convertOption.startTime
                if(document.getElementById("previewDuration")) {
                    let durationHTML = "<div>Duration: " + Math.round(duration) +  " sec(s)</div>"
                    document.getElementById("previewDuration").innerHTML = durationHTML
                }

                if(previewVideo.currentTime < this.props.convertOption.startTime
                    || previewVideo.currentTime > this.props.convertOption.endTime) {
                    previewVideo.currentTime = this.props.convertOption.startTime
                }
            }else{
                if(document.getElementById("previewDuration")) {
                    document.getElementById("previewDuration").innerHTML = ""
                }
            }
        })

        let that = this
        ipcRenderer.on('saved-file', (event, path) => {
            if (!path) {
                path = ""
            } else {
                that.props.updateConvertOption({videoOutputPath: path})
            }
        })
    }

    updateTimeStamp(event) {
        let vid = document.getElementById("inputVideo")
        let newTime = Math.round(event.target.value)

        switch(event.target.id) {
            case "startTimeInput":
                this.props.updateConvertOption({startTime: newTime})
                break
            case "startTimeButton":
                this.props.updateConvertOption({startTime: Math.round(vid.currentTime)})
                break
            case "endTimeInput":
                this.props.updateConvertOption({endTime: newTime})
                break
            case "endTimeButton":
                this.props.updateConvertOption({endTime: Math.round(vid.currentTime)})
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
        let that = this

        // no need to scale if using original
        let scale = this.props.convertOption.widthLimit === 'original' ?
                        "": "-vf scale="+parseInt(this.props.convertOption.widthLimit)+":-1 "

        let duration = this.props.convertOption.endTime - this.props.convertOption.startTime

        let cutting = "-ss " + this.props.convertOption.startTime + " -t " + duration

        let cmd = CONFIG.repositoryRootPath + '/bin/ffmpeg/ffmpeg ' + cutting + ' -i '
                    + this.props.videoInputPath + ' -r 24 ' + scale + '-y '
                    + this.props.convertOption.videoOutputPath

        that.setState({
            isConverting: true
        })

        let ls = exec(cmd)

        ls.on('close', (code) => {
            that.setState({
                isConverting: false
            })
        })
    }

    render() {
        let loadingOverlay = null

        if(this.state.isConverting) {
            loadingOverlay =
                <div className="overlay">
                    <img className="loader"
                         src={`${CONFIG.repositoryRootPath}/app/images/Pacman.gif`}
                         alt="Converting..."/>
                    <div className="loader-text">Converting, please be patient ... </div>
                </div>
        }

        return(
            <div>
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
                                       value="800"
                                       checked={this.props.convertOption.widthLimit==="800"}
                                       onChange={this.updateConvertWidth}/>
                                <label htmlFor="widthRadio2">800px</label>

                                <input type="radio"
                                       id="widthRadio3"
                                       name="widthRadios"
                                       value="1000"
                                       checked={this.props.convertOption.widthLimit==="1000"}
                                       onChange={this.updateConvertWidth}/>
                                <label htmlFor="widthRadio3">1000px</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-container">
                    <div className="gifPreview">
                        <h4>Output Gif Preview</h4>
                        <video id="preview" width="350" autoPlay loop>
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
                            <button onClick={this.convertVideo}>Convert</button>
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