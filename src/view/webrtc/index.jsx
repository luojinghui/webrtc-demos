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
			videos: [],
			audioInputList: [],
			audioOutputList: [],
			videoInList: []
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
		const audioInputList = [];
		const audioOutputList = [];
		const videoInList = [];

		for (let i = 0; i < devices.length; i++) {
			const deviceInfo = devices[i];
			let item = {
				value: deviceInfo.deviceId
			};

			if (deviceInfo.kind === 'audioinput') {
				item.text = deviceInfo.label || `microphone ${audioInputList.length + 1}`;

				audioInputList.push(item);

			} else if (deviceInfo.kind === 'audiooutput') {
				item.text = deviceInfo.label || `speaker ${audioOutputList.length + 1}`;

				audioOutputList.push(item);
			} else if (deviceInfo.kind === 'videoinput') {
				item.text = deviceInfo.label || `camera ${videoInList.length + 1}`;

				videoInList.push(item);
			} else {
				console.log('Some other kind of source/device: ', deviceInfo);
			}
		}

		this.setState({
			audioInputList,
			audioOutputList,
			videoInList
		});
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
		const { audioInputList, audioOutputList, videoInList } = this.state;

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
						<label>Audio input source:</label>
						<select>
							{audioInputList.map(item => (
								<option key={item.value} value={item.value}>
									{item.text}
								</option>
							))}
						</select>
					</div>

					<div className="audio-output">
						<label>Audio output source:</label>
						<select>
							{audioOutputList.map(item => (
								<option key={item.value} value={item.value}>
									{item.text}
								</option>
							))}
						</select>
					</div>

					<div className="video-source">
						<label>Video source:</label>
						<select>
							{videoInList.map(item => (
								<option key={item.value} value={item.value}>
									{item.text}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
		);
	}
}
