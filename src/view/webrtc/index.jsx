import React, { Component } from 'react';
import 'webrtc-adapter';
import Video from '../../componentes/video';

export default class Webrtc extends Component {
	constructor(props) {
		super(props);

		this.state = {
			videos: [],
			audioInputList: [],
			audioOutputList: [],
			videoInList: [],
			selectAudioInputValue: '',
			selectAudioOutputValue: '',
			selectvideoInValue: ''
		};

		this.handleSuccess = this.handleSuccess.bind(this);
		this.onHandleOpenCamera = this.onHandleOpenCamera.bind(this);
		this.onSnapshot = this.onSnapshot.bind(this);
		this.onChangeAudioInput = this.onChangeAudioInput.bind(this);
		this.onChangeVideoInput = this.onChangeVideoInput.bind(this);
		this.onChangeAudioOutput = this.onChangeAudioOutput.bind(this);
	}

	get constraints() {
		const { selectAudioInputValue, selectvideoInValue } = this.state;

		return {
			audio: {
				deviceId: selectAudioInputValue ? { exact: selectAudioInputValue } : undefined
			},
			video: {
				deviceId: selectvideoInValue ? { exact: selectvideoInValue } : undefined,
				aspectRatio: 1.778,
				resizeMode: 'crop-and-scale'
			}
		};
	}

	handleError(error) {
		if (error.name === 'ConstraintNotSatisfiedError') {
			let v = this.constraints.video;
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
			const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
			this.handleSuccess(stream);

			console.log('windowstram: ', window.stream);
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

	componentDidMount() {
		this.initDevices();
	}

	async initDevices() {
		try {
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
				videoInList,
				selectAudioInputValue: audioInputList[0].value,
				selectAudioOutputValue: audioOutputList[0] ? audioOutputList[0].value : "",
				selectvideoInValue: videoInList[0].value
			});
		} catch (error) {
			console.log('navigator.MediaDevices.getUserMedia error: ', error);
		}
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

	onChangeAudioInput(e) {
		if (this.state.selectAudioInputValue !== e.target.value) {
			this.setState(
				{
					selectAudioInputValue: e.target.value
				},
				() => {
					this.onHandleOpenCamera({});
				}
			);
		}
	}

	onChangeVideoInput(e) {
		if (this.state.selectvideoInValue !== e.target.value) {
			this.setState(
				{
					selectvideoInValue: e.target.value
				},
				() => {
					this.onHandleOpenCamera({});
				}
			);
		}
	}

	async attachSinkId() {
    const element = this.video && this.video.getVideoRef();
    const { selectAudioOutputValue: sinkId } = this.state;

		if (typeof element.sinkId !== 'undefined') {
			try {
				const result = await element.setSinkId(sinkId);

				console.log('result: ', result);
				if (result) {
					console.log(`Success, audio output device attached: ${sinkId}`);
				}
			} catch (error) {
				let errorMessage = error;

				if (error.name === 'SecurityError') {
					errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
				}
				console.error(errorMessage);
			}
		} else {
			console.warn('Browser does not support output device selection.');
		}
  }
  
  onChangeAudioOutput(e) {
		if (this.state.selectAudioOutputValue !== e.target.value) {
			this.setState(
				{
					selectAudioOutputValue: e.target.value
				},
				() => {
					this.attachSinkId();
				}
			);
		}    
  }

	render() {
		const { audioInputList, audioOutputList, videoInList, selectAudioInputValue, selectvideoInValue, selectAudioOutputValue } = this.state;

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
						<select onChange={this.onChangeAudioInput} value={selectAudioInputValue}>
							{audioInputList.map(item => (
								<option key={item.value} value={item.value}>
									{item.text}
								</option>
							))}
						</select>
					</div>

					<div className="audio-output">
						<label>Audio output source:</label>
						<select onChange={this.onChangeAudioOutput} value={ selectAudioOutputValue }>
							{audioOutputList.map(item => (
								<option key={item.value} value={item.value}>
									{item.text}
								</option>
							))}
						</select>
					</div>

					<div className="video-source">
						<label>Video source:</label>
						<select onChange={this.onChangeVideoInput} value={selectvideoInValue}>
							>
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
