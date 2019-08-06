import React, { Component } from 'react';
import Video from '../../video';

const constraints = (window.constraints = {
	audio: false,
	video: true
});

export default class Webrtc extends Component {
	constructor(props) {
		super(props);

		this.state = {
			videos: []
		};

    this.handleSuccess = this.handleSuccess.bind(this);
    this.onHandleOpenCamera = this.onHandleOpenCamera.bind(this);
	}

  handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
      let v = constraints.video;
      console.log(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'PermissionDeniedError') {
      console.log('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    console.log(`getUserMedia error: ${error.name}`, error);
  }

	async onHandleOpenCamera(e) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.handleSuccess(stream);
		} catch (e) {
			this.handleError(e);
		}
	}

	handleSuccess(stream) {
		const videoTracks = stream.getVideoTracks();

		console.log('Got stream with constraints:', constraints);
		console.log(`Using video device: ${videoTracks[0].kind}`);
		console.log(`stream: ${stream}`);
		window.stream = stream; // make variable available to browser console

		this.setState({
			videos: [stream]
		});
	}

	render() {
		return (
			<div className="container">
				<div className="video-list">
					{this.state.videos.map((item, index) => (
            <Video media={item} key={index} />
					))}
				</div>
				<button onClick={this.onHandleOpenCamera}>Open camera</button>
			</div>
		);
	}
}
