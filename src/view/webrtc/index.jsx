import React, { Component } from 'react';
import Video from '../../componentes/video';

const constraints = (window.constraints = {
	audio: false,
	video: {
		aspectRatio: 1.778,
		resizeMode: 'crop-and-scale'
	}
});

export default class Webrtc extends Component {
	constructor(props) {
		super(props);

		this.state = {
			videos: []
		};

		this.handleSuccess = this.handleSuccess.bind(this);
		this.onHandleOpenCamera = this.onHandleOpenCamera.bind(this);
		this.onSnapshot = this.onSnapshot.bind(this);
	}

	handleError(error) {
		if (error.name === 'ConstraintNotSatisfiedError') {
			let v = constraints.video;
			console.log(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
		} else if (error.name === 'PermissionDeniedError') {
			console.log(
				'Permissions have not been granted to use your camera and ' +
					'microphone, you need to allow the page access to your devices in ' +
					'order for the demo to work.'
			);
		}
		console.log(`getUserMedia error: ${error.name}`, error);
	}

	async onHandleOpenCamera(e) {
		try {
			// MediaDevices 是一个单例对象。通常，您只需直接使用此对象的成员，例如通过调用
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.handleSuccess(stream);
		} catch (e) {
			this.handleError(e);
		}
	}

	handleSuccess(stream) {
		const videoTracks = stream.getVideoTracks();
		const audioTracks = stream.getAudioTracks();

		console.log(`Using video device: ${videoTracks[0].kind}`);
		console.log(`Using video device: ${audioTracks}`);
		console.log(`stream: ${stream}`);
		window.stream = stream; // make variable available to browser console

		this.setState({
			videos: [stream]
		});
  }
  
  async componentDidMount() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    console.log("devices: ", devices);
  }

	onSnapshot() {
		try {
			const canvas = this.canvas;
      const video = this.video && this.video.getVideoRef();
      
			if (video) {
				canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
			}
		} catch (e) {
			this.handleError(e);
		}
	}

	render() {
		return (
			<div className="container">
				<div className="video-list">
					{this.state.videos.map((item, index) => (
						<Video ref={ref => (this.video = ref)} media={item} key={index} />
					))}

					<canvas ref={ref => (this.canvas = ref)} />
				</div>
				<div className="btns">
					<button onClick={this.onHandleOpenCamera}>Open camera</button>
					<button onClick={this.onSnapshot}>take snapshot</button>
				</div>
        <div className="select">
          <div className="audio-input">
            Audio input source:
          </div>
          <div className="audio-output">
            Audio output source:
          </div>
          <div className="video-source">
            Video source:
          </div>
        </div>
			</div>
		);
	}
}
