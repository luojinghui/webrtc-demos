import React, { Component } from 'react';
import adapter from 'webrtc-adapter';
import Video from '../../componentes/video/index';

const offerOptions = {
	offerToReceiveAudio: 0,
	offerToReceiveVideo: 1
};

export default class AdjustBandWidth extends Component {
	constructor(props) {
		super(props);

		this.state = {
			callButtonDisabled: false,
			bandwidthSelectorDisabled: true,
			hangupButtonDisabled: true,
			remoteVideoStream: {
				media: null
			},
			localVideoStream: {
				media: null
			},
			option: 'unlimited'
		};

		this.call = this.call.bind(this);
		this.hangup = this.hangup.bind(this);
		this.onIceCandidate = this.onIceCandidate.bind(this);
		this.gotRemoteStream = this.gotRemoteStream.bind(this);
		this.gotStream = this.gotStream.bind(this);
		this.gotDescription1 = this.gotDescription1.bind(this);
		this.gotDescription2 = this.gotDescription2.bind(this);
		this.updateBandwidthRestriction = this.updateBandwidthRestriction.bind(this);
		this.onChangeBandWidth = this.onChangeBandWidth.bind(this);

		this.pc1 = null;
		this.pc2 = null;
		this.maxBandwidth = 0;
	}

	async call() {
		this.setState({
			callButtonDisabled: true,
			bandwidthSelectorDisabled: false
		});

		console.log('Starting call');
		const servers = null;
		this.pc1 = new RTCPeerConnection(servers);

		console.log('Created local peer connection object pc1');
		this.pc1.addEventListener('icecandidate', e => this.onIceCandidate(this.pc1, e));

		this.pc2 = new RTCPeerConnection(servers);
		console.log('Created remote peer connection object pc2');
		this.pc2.addEventListener('icecandidate', e => this.onIceCandidate(this.pc2, e));

		this.pc2.ontrack = this.gotRemoteStream;

		console.log('Requesting local stream');

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			this.gotStream(stream);
		} catch (err) {
			alert('getUserMedia() error: ' + err.name);
		}
	}

	async gotStream(stream) {
		this.setState({
			hangupButtonDisabled: false,
			localVideoStream: {
				media: stream
			}
		});

		const localVideoStream = stream;

		console.log('Received local stream');

		localVideoStream.getTracks().forEach(track => this.pc1.addTrack(track, localVideoStream));
		console.log('Adding Local Stream to peer connection');

		try {
			const desc = await this.pc1.createOffer(offerOptions);
			this.gotDescription1(desc);
		} catch (error) {
			console.log('Failed to create session description: ' + error.toString());
		}

		// bitrateSeries = new TimelineDataSeries();
		// bitrateGraph = new TimelineGraphView('bitrateGraph', 'bitrateCanvas');
		// bitrateGraph.updateEndDate();

		// packetSeries = new TimelineDataSeries();
		// packetGraph = new TimelineGraphView('packetGraph', 'packetCanvas');
		// packetGraph.updateEndDate();
	}

	async gotDescription1(desc) {
		console.log('Offer from pc1 \n' + desc.sdp);

		try {
			await this.pc1.setLocalDescription(desc);
			await this.pc2.setRemoteDescription(desc);
			const desc2 = await this.pc2.createAnswer();
			this.gotDescription2(desc2);
		} catch (err) {
			console.log('get desc erro: ', err);
		}
	}

	async gotDescription2(desc) {
		try {
			let p;

			await this.pc2.setLocalDescription(desc);
			console.log('Answer from pc2 \n' + desc.sdp);

			if (this.maxBandwidth) {
				p = this.pc1.setRemoteDescription({
					type: desc.type,
					sdp: this.updateBandwidthRestriction(desc.sdp, this.maxBandwidth)
				});
			} else {
				p = this.pc1.setRemoteDescription(desc);
			}
			p.then(
				() => {},
				err => {
					console.log('err: ', err);
				}
			);
		} catch (error) {
			console.log('Failed to set session description: ' + error.toString());
		}
	}

	updateBandwidthRestriction(sdp, bandwidth) {
		let modifier = 'AS';
		if (adapter.browserDetails.browser === 'firefox') {
			bandwidth = (bandwidth >>> 0) * 1000;
			modifier = 'TIAS';
		}
		if (sdp.indexOf('b=' + modifier + ':') === -1) {
			// insert b= after c= line.
			sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
		} else {
			sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
		}
		return sdp;
	}

	async onIceCandidate(pc, event) {
		try {
			await this.getOtherPc(pc).addIceCandidate(event.candidate);
			console.log(`${this.getName(pc)} addIceCandidate success`);
		} catch (error) {
			console.log(`${this.getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
		}
	}

	gotRemoteStream(e) {
		const { remoteVideoStream } = this.state;

		if (remoteVideoStream.media !== e.streams[0]) {
			this.setState({
				remoteVideoStream: {
					media: e.streams[0]
				}
			});
			console.log('Received remote stream');
		}
	}

	getName(pc) {
		return pc === this.pc1 ? 'pc1' : 'pc2';
	}

	getOtherPc(pc) {
		return pc === this.pc1 ? this.pc2 : this.pc1;
	}

	hangup() {
		console.log('Ending call');

		this.state.localVideoStream.media.getTracks().forEach(track => track.stop());

		this.pc1.close();
		this.pc2.close();
		this.pc1 = null;
		this.pc2 = null;

		this.setState({
			hangupButtonDisabled: true,
			callButtonDisabled: false,
			bandwidthSelectorDisabled: true
		});
	}

	onChangeBandWidth(e) {
    const bandwidth = e.target.value;

    this.setState({
      bandwidthSelectorDisabled: true,
      option: bandwidth
    });

    console.log("adapter.browserDetails.browser:" , adapter.browserDetails.browser);
    
		// In Chrome, use RTCRtpSender.setParameters to change bandwidth without
		// (local) renegotiation. Note that this will be within the envelope of
    // the initial maximum bandwidth negotiated via SDP.
    
    // 参考： https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpEncodingParameters
		if (
			(adapter.browserDetails.browser === 'chrome' ||
				(adapter.browserDetails.browser === 'firefox' && adapter.browserDetails.version >= 64)) &&
			'RTCRtpSender' in window &&
			'setParameters' in window.RTCRtpSender.prototype
		) {
      const sender = this.pc1.getSenders()[0];
      console.log("sender: ", sender);
			const parameters = sender.getParameters();
			if (!parameters.encodings) {
				parameters.encodings = [{}];
      }
      
			if (bandwidth === 'unlimited') {
				delete parameters.encodings[0].maxBitrate;
			} else {
				parameters.encodings[0].maxBitrate = bandwidth * 1000;
      }

      console.log("parameters: ", parameters);
      
			sender
				.setParameters(parameters)
				.then(() => {
          console.log("send: ", 123);
          this.setState({
            bandwidthSelectorDisabled: false
          });
				})
				.catch(e => console.error(e));
			return;
    }

    console.log("next ...");
    
		// Fallback to the SDP munging with local renegotiation way of limiting
		// the bandwidth.
		this.pc1
			.createOffer()
			.then(offer => this.pc1.setLocalDescription(offer))
			.then(() => {
        console.log("create offer: ", 234);
				const desc = {
					type: this.pc1.remoteDescription.type,
					sdp:
						bandwidth === 'unlimited'
							? this.removeBandwidthRestriction(this.pc1.remoteDescription.sdp)
							: this.updateBandwidthRestriction(this.pc1.remoteDescription.sdp, bandwidth)
				};
				console.log('Applying bandwidth restriction to setRemoteDescription:\n' + desc.sdp);
				return this.pc1.setRemoteDescription(desc);
			})
			.then(() => {
				this.setState({
          bandwidthSelectorDisabled: false
        });
			})
			.catch((err) => {
        console.log("aj bandwidth error: ", err);
      });
  }
  
  removeBandwidthRestriction(sdp) {
    return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
  }

	render() {
		const {
			callButtonDisabled,
			bandwidthSelectorDisabled,
			hangupButtonDisabled,
			localVideoStream,
			remoteVideoStream,
			option
		} = this.state;

		return (
			<div>
				<div className="video-list">
					<Video control={true} ref={ref => (this.localVideo = ref)} media={localVideoStream.media} />
					<Video ref={ref => (this.remoteVideo = ref)} media={remoteVideoStream.media} />
				</div>

				<div className="btns">
					<label>Bandwidth:</label>
					<select
						id="bandwidth"
						className="bandwidth"
						disabled={bandwidthSelectorDisabled}
						value={option}
						onChange={this.onChangeBandWidth}
					>
						<option value="unlimited">unlimited</option>
						<option value="2000">2000</option>
						<option value="1000">1000</option>
						<option value="500">500</option>
						<option value="250">250</option>
						<option value="125">125</option>
					</select>
					<button id="callButton" disabled={callButtonDisabled} onClick={this.call}>
						Call
					</button>
					<button id="hangupButton" disabled={hangupButtonDisabled} onClick={this.hangup}>
						Hang Up
					</button>
				</div>
			</div>
		);
	}
}
