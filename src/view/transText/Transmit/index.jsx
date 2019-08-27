import React, { Component } from 'react';

export default class Transmit extends Component {
	constructor(props) {
		super(props);

		this.state = {
			dataChannelSend: true,
			dataChannelSendValue: '',
			dataChannelReceive: true,
			dataChannelReceiveValue: '',
			sendButton: true,
			closeButton: true,
			startButton: false
		};

		// 开始创建connection
		this.createConnection = this.createConnection.bind(this);
		this.gotDescription1 = this.gotDescription1.bind(this);
		this.gotDescription2 = this.gotDescription2.bind(this);
		this.onSendChannelStateChange = this.onSendChannelStateChange.bind(this);
		this.receiveChannelCallback = this.receiveChannelCallback.bind(this);
		this.onReceiveChannelStateChange = this.onReceiveChannelStateChange.bind(this);
		this.sendData = this.sendData.bind(this);
		this.onChangeSendValue = this.onChangeSendValue.bind(this);
		this.onReceiveMessageCallback = this.onReceiveMessageCallback.bind(this);
		this.closeDataChannels = this.closeDataChannels.bind(this);

		this.localConnection = null;
		this.remoteConnection = null;
		this.sendChannel = null;
		this.receiveChannel = null;
	}

	createConnection() {
		const servers = null;

		this.localConnection = new RTCPeerConnection(servers);
		console.log('Created local peer connection object localConnection');

		this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');
		console.log('Created send data channel', this.sendChannel);

		// 注册 onicecandidate 句柄
		// 首先，需要注册一个onicecandidate句柄来发送任何ICE候选给其它端，
		// 一旦收到后，就会使用其中一个信令通道。
		this.localConnection.onicecandidate = e => {
			this.onIceCandidate(this.localConnection, e);
		};
		this.sendChannel.onopen = this.onSendChannelStateChange;
		this.sendChannel.onclose = this.onSendChannelStateChange;

		// remote peerconnection
		this.remoteConnection = new RTCPeerConnection(servers);
		console.log('Created remote peer connection object remoteConnection');

		this.remoteConnection.onicecandidate = e => {
			this.onIceCandidate(this.remoteConnection, e);
		};
		this.remoteConnection.ondatachannel = this.receiveChannelCallback;

		this.localConnection.createOffer().then(this.gotDescription1, this.onCreateSessionDescriptionError);

		this.setState({
			startButton: true,
			closeButtonL: false
		});
	}

	gotDescription1(desc) {
		this.localConnection.setLocalDescription(desc);
		console.log(`Offer from localConnection\n${desc.sdp}`);

		this.remoteConnection.setRemoteDescription(desc);
		this.remoteConnection.createAnswer().then(this.gotDescription2, this.onCreateSessionDescriptionError);
	}

	onCreateSessionDescriptionError(error) {
		console.log('Failed to create session description: ' + error.toString());
	}

	gotDescription2(desc) {
		this.remoteConnection.setLocalDescription(desc);
		console.log(`Answer from remoteConnection\n${desc.sdp}`);
		this.localConnection.setRemoteDescription(desc);
	}

	receiveChannelCallback(event) {
		console.log('Receive Channel Callback');

		this.receiveChannel = event.channel;
		this.receiveChannel.onmessage = this.onReceiveMessageCallback;
		this.receiveChannel.onopen = this.onReceiveChannelStateChange;
		this.receiveChannel.onclose = this.onReceiveChannelStateChange;
	}

	onReceiveMessageCallback(event) {
		console.log('Received Message');
		this.setState({
			dataChannelReceiveValue: event.data
		});
	}

	onReceiveChannelStateChange() {
		const readyState = this.receiveChannel.readyState;
		console.log(`Receive channel state is: ${readyState}`);
	}

	getOtherPc(pc) {
		return pc === this.localConnection ? this.remoteConnection : this.localConnection;
	}

	getName(pc) {
		return pc === this.localConnection ? 'localPeerConnection' : 'remotePeerConnection';
	}

	onIceCandidate(pc, event) {
		this.getOtherPc(pc)
			.addIceCandidate(event.candidate)
			.then(() => this.onAddIceCandidateSuccess(pc), err => this.onAddIceCandidateError(pc, err));
		console.log(`${this.getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
	}

	onAddIceCandidateSuccess() {
		console.log('AddIceCandidate success.');
	}

	onAddIceCandidateError(error) {
		console.log(`Failed to add Ice Candidate: ${error.toString()}`);
	}

	onSendChannelStateChange() {
		console.log('this.sendChannel: ', this.sendChannel);
		const readyState = this.sendChannel.readyState;
		console.log('Send channel state is: ' + readyState);

		if (readyState === 'open') {
			this.setState({
				dataChannelSend: false,
				sendButton: false,
				closeButton: false
			});
			this.dataChannelSendRef.focus();
		} else {
			this.setState({
				dataChannelSend: true,
				sendButton: true,
				closeButton: true
			});
		}
	}

	sendData() {
		const data = this.state.dataChannelSendValue;
		this.sendChannel.send(data);
		console.log('Sent Data: ' + data);
	}

	onChangeSendValue(e) {
		this.setState({
			dataChannelSendValue: e.target.value
		});
	}

	closeDataChannels() {
		console.log('Closing data channels');
		this.sendChannel.close();
		console.log('Closed data channel with label: ' + this.sendChannel.label);
		this.receiveChannel.close();
		console.log('Closed data channel with label: ' + this.receiveChannel.label);
		this.localConnection.close();
		this.remoteConnection.close();
		this.localConnection = null;
		this.remoteConnection = null;
    console.log('Closed peer connections');
    
    this.setState({
      startButton: false,
      sendButton: true,
      closeButton: true,
      dataChannelSendValue: "",
      dataChannelReceiveValue: "",
      dataChannelSend: true
    })
	}

	render() {
		const {
			dataChannelSend,
			dataChannelSendValue,
			dataChannelReceive,
			dataChannelReceiveValue,
			sendButton,
			closeButton
		} = this.state;

		return (
			<div className="trans-text">
				<h1>Transmit text</h1>

				<div className="btns">
					<button onClick={this.createConnection}>Start</button>
					<button id="sendButton" onClick={this.sendData} disabled={sendButton}>
						Send
					</button>
					<button id="closeButton" onClick={this.closeDataChannels} disabled={closeButton}>
						Stop
					</button>
				</div>

				<div className="send-receive">
					<div className="send">
						<h2>Send</h2>
						<textarea
							ref={ref => (this.dataChannelSendRef = ref)}
							id="dataChannelSend"
							disabled={dataChannelSend}
							value={dataChannelSendValue}
							onChange={this.onChangeSendValue}
							placeholder="Press Start, enter some text, then press Send."
						/>
					</div>

					<div className="receive">
						<h2>Receive</h2>
						<textarea
							value={dataChannelReceiveValue}
							id="dataChannelReceive"
							disabled={dataChannelReceive}
						/>
					</div>
				</div>
			</div>
		);
	}
}
