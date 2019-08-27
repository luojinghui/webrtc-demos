import React, { Component } from 'react';
import Video from '../../componentes/video/index';

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

export default class BaseConnection extends Component {
	constructor(props) {
		super(props);

		this.state = {
			startButtonDisabled: false,
			callButtonDisabled: true,
			hangupButtonDisabled: true,
			localVideoStream: {
				media: null
      },
      multLocalVideoStream: {
        media: null
      },
      multLocalVideoStream2: {
        media: null
      },      
			remoteVideoStream: {
				media: null
			},
			option: 'unified-plan'
		};

		this.localStream = null;
		this.localVideo = null;
		this.startTime = null;

		this.pc1 = null;
		this.pc2 = null;

		this.start = this.start.bind(this);
		this.call = this.call.bind(this);
		this.onChangeSdpSemantics = this.onChangeSdpSemantics.bind(this);
		this.onIceCandidate = this.onIceCandidate.bind(this);
		this.onIceStateChange = this.onIceStateChange.bind(this);
    this.gotRemoteStream = this.gotRemoteStream.bind(this);
    this.onCreateOfferSuccess = this.onCreateOfferSuccess.bind(this);
    this.onCreateAnswerSuccess = this.onCreateAnswerSuccess.bind(this);
    this.hangup = this.hangup.bind(this);
	}

	getName(pc) {
		return pc === this.pc1 ? 'pc1' : 'pc2';
	}

	getOtherPc(pc) {
		return pc === this.pc1 ? this.pc2 : this.pc1;
	}

	async start() {
		console.log('Requesting local stream');
		this.setState({ startButtonDisabled: true });

		try {
			this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      console.log('Received local stream', this.localStream);
      
			this.setState({
				localVideoStream: {
					media: this.localStream
        },
        multLocalVideoStream: {
          media: this.localStream.clone()
        },
        multLocalVideoStream2: {
          media: this.localStream.clone()
        },
				callButtonDisabled: false
			}, () => {
        console.log("localVideoStream:  ", this.state.localVideoStream);
        console.log("multLocalVideoStream:  ", this.state.multLocalVideoStream);
        console.log("multLocalVideoStream2:  ", this.state.multLocalVideoStream2);
      });
		} catch (e) {
			alert(`getUserMedia() error: ${e.name}`);
		}
	}

	async call() {
		this.setState({
			callButtonDisabled: true,
			hangupButtonDisabled: false
		});

		this.startTime = window.performance.now();

		// 获取音视频轨道
		const videoTracks = this.localStream.getVideoTracks();
		const audioTracks = this.localStream.getAudioTracks();

		if (videoTracks.length > 0) {
			console.log(`Using video device: ${videoTracks[0].label}`);
		}
		if (audioTracks.length > 0) {
			console.log(`Using audio device: ${audioTracks[0].label}`);
		}

		const configuration = this.getSelectedSdpSemantics();
		console.log('RTCPeerConnection configuration:', configuration);

		this.pc1 = new RTCPeerConnection(configuration);
		console.log('Created local peer connection object pc1');
		this.pc1.addEventListener('icecandidate', e => this.onIceCandidate(this.pc1, e));

		this.pc2 = new RTCPeerConnection(configuration);
		console.log('Created remote peer connection object pc2');
		this.pc2.addEventListener('icecandidate', e => this.onIceCandidate(this.pc2, e));

		this.pc1.addEventListener('iceconnectionstatechange', e => this.onIceStateChange(this.pc1, e));
		this.pc2.addEventListener('iceconnectionstatechange', e => this.onIceStateChange(this.pc2, e));

    this.pc2.addEventListener('track', this.gotRemoteStream);

		this.localStream.getTracks().forEach(track => this.pc1.addTrack(track, this.localStream));
		console.log('Added local stream to pc1');

		try {
			console.log('pc1 createOffer start');
      const offer = await this.pc1.createOffer(offerOptions);
      
			await this.onCreateOfferSuccess(offer);
		} catch (e) {
			console.log(`Failed to create session description: ${e.toString()}`);
		}
  }
  
  async onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    try {
      await this.pc1.setLocalDescription(desc);
      console.log(`pc1 setLocalDescription complete`);
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
    }
  
    console.log('pc2 setRemoteDescription start');
    try {
      await this.pc2.setRemoteDescription(desc);
      console.log(`pc2 setLocalDescription complete`);
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
    }
  
    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await this.pc2.createAnswer();

      await this.onCreateAnswerSuccess(answer);
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
    }
  }  

  async onCreateAnswerSuccess(desc) {
    console.log(`Answer from pc2:\n${desc.sdp}`);
    console.log('pc2 setLocalDescription start');

    try {
      await this.pc2.setLocalDescription(desc);
      console.log(`pc2 setLocalDescription complete`);
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
    }
    console.log('pc1 setRemoteDescription start');

    try {
      await this.pc1.setRemoteDescription(desc);
      console.log(`pc1 setLocalDescription complete`);
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
    }
  }

	gotRemoteStream(e) {
		console.log('remote stream: ', e);
		const { remoteVideoStream } = this.state;

		if (remoteVideoStream.media !== e.streams[0]) {
			this.setState({
				remoteVideoStream: {
					media: e.streams[0]
				}
			});

			console.log('pc2 received remote stream');
		}
	}

	onIceStateChange(pc, event) {
		if (pc) {
			console.log(`${this.getName(pc)} ICE state: ${pc.iceConnectionState}`);
			console.log('ICE state change event: ', event);
		}
	}

	async onIceCandidate(pc, event) {
		try {
			await this.getOtherPc(pc).addIceCandidate(event.candidate);
			console.log(`${this.getName(pc)} addIceCandidate success`);
		} catch (error) {
			console.log(`${this.getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
		}
	}

	getSelectedSdpSemantics() {
		const option = this.state.option;

		return option === '' ? {} : { sdpSemantics: option };
	}

	onChangeSdpSemantics(e) {
		this.setState({
			option: e.target.value
		});
  }
  
  hangup() {
    console.log('Ending call');

    this.pc1.close();
    this.pc2.close();

    this.pc1 = null;
    this.pc2 = null;

    this.setState({
      hangupButtonDisabled: true,
      callButtonDisabled: false  
    })
  }

	render() {
		const { startButtonDisabled, callButtonDisabled, localVideoStream, remoteVideoStream, option, hangupButtonDisabled, multLocalVideoStream, multLocalVideoStream2 } = this.state;

		return (
			<div>
				<div className="video-list">
          <Video control={true} ref={ref => (this.localVideo = ref)} media={localVideoStream.media} />
          <Video ref={ref => (this.remoteVideo = ref)} media={remoteVideoStream.media} />
          <Video ref={ref => (this.multLocalVideo = ref)} media={multLocalVideoStream.media} />
          <Video ref={ref => (this.multLocalVideo2 = ref)} media={multLocalVideoStream2.media} />
        </div>

				<div className="btns">
					<button id="startButton" disabled={startButtonDisabled} onClick={this.start}>
						Start
					</button>
					<button id="callButton" disabled={callButtonDisabled} onClick={this.call}>
						Call
					</button>
					<button id="hangupButton" disabled={hangupButtonDisabled} onClick={this.hangup}>
						Hang Up
					</button>
					<div className="box" />

					<span>SDP Semantics:</span>
					<select id="sdpSemantics" value={option} onChange={this.onChangeSdpSemantics}>
						<option value="unified-plan">Default</option>
						<option value="unified-plan">Unified Plan</option>
						<option value="plan-b">Plan B</option>
					</select>
				</div>
			</div>
		);
	}
}
