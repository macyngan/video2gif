import React from 'react'
import ReactDOM from 'react-dom'
import VideoUploader from './VideoUploader'
import VideoConverter from './VideoConverter'

class MainInterface extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            currentState: "upload", // enum {'upload', 'convert'}
            videoInputPath: "",
            convertOption: {
                startTime: 0,
                endTime: 0,
                widthLimit: "original",
                videoOutputPath: "",
            },
            inputVideoDetail: {
                name: "",
                format: "",
                width: "",
                height:"",
                duration: 0
            }
        }

        this.uploadedVideo = this.uploadedVideo.bind(this)
        this.updateConvertOption = this.updateConvertOption.bind(this)
        this.updateVideoDetail = this.updateVideoDetail.bind(this)
        this.returnToHomePage = this.returnToHomePage.bind(this)
    }

    componentDidMount(){
        document.addEventListener('drop', function(e) {
            e.preventDefault()
            e.stopPropagation()
        })

        document.addEventListener('dragover', function(e) {
            e.preventDefault()
            e.stopPropagation()
        })
    }

    updateConvertOption(updateObj) {
        this.setState({
            convertOption: Object.assign(this.state.convertOption, updateObj)
        })
    }

    updateVideoDetail(updateObj) {
        this.setState({
            inputVideoDetail: Object.assign(this.state.inputVideoDetail, updateObj)
        })
    }

    uploadedVideo(path) {
        this.setState({
            currentState: 'convert',
            videoInputPath: path
        })
    }

    returnToHomePage() {
        this.setState({
            currentState: 'upload',
            videoInputPath: "",
            convertOption: {
                startTime: 0,
                endTime: 0,
                widthLimit: "original",
                videoOutputPath: ""
            }
        })
    }

    render() {
        return(
            <div>
                <div className="logo">
                    <img width="250px"
                         src="./images/video2gif_logo.png"
                         alt="Video2Gif"
                         onClick={this.returnToHomePage}/>
                </div>

                {this.state.currentState == 'upload' ?
                    <VideoUploader videoInputPath = {this.state.videoInputPath}
                                   uploadedVideo={this.uploadedVideo}
                                   updateVideoDetail={this.updateVideoDetail}
                                   updateConvertOption={this.updateConvertOption}
                                    />
                    :
                    <VideoConverter videoInputPath = {this.state.videoInputPath}
                                    convertOption={this.state.convertOption}
                                    updateConvertOption={this.updateConvertOption}
                                    videoDetail={this.state.inputVideoDetail}
                                    backToHomePage={this.returnToHomePage}/>
                }
            </div>
        )
    }
}

ReactDOM.render(<MainInterface />, document.getElementById('app'))