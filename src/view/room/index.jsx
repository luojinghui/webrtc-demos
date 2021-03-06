import React, { Component } from 'react';
import 'webrtc-adapter';
import { message, Form, Icon, Input, Button, Row, Col } from 'antd';
import socketIOClient from 'socket.io-client';
import * as config from '../../configure';

const configuration = {
  iceServers: [config.DEFAULT_ICE_SERVER],
  sdpSemantics: "unified-plan"
};
let localStream;
let screenStream;
let cloneLocalStream;
let captureStream;
const peerConn = [];

class Room extends Component {
	constructor(props) {
		super(props);

		this.state = {
			name: '',
			show: true,
			roomID: props.match.params.room, //房间号
			users: '' //当前房间的所有用户
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.initCreate = this.initCreate.bind(this);
	}

	componentDidMount() {
    this.socket = socketIOClient(config.API_ROOT);

		this.socket.on('message', data => {
			console.log(data);

			switch (data.event) {
				case 'join':
					this.handleLogin(data);
					break;
				case 'offer':
					this.handleOffer(data);
					break;
				case 'candidate':
					this.handleCandidate(data);
					break;
				case 'msg':
					this.handleMsg(data);
					break;
				case 'answer':
					this.handleAnswer(data);
					break;
				case 'leave':
					this.handleLeave(data);
					break;
				default:
					break;
			}
		});
  }
  
  componentWillUnmount() {
    this.socket.close();
    console.log("this.socket close");
  }

	handleLeave(data) {
		message.info('用户' + data.name + '已退出');

    this.setState({
      users: data.users
    })
		// Remove video src for the exist user
    const video = document.getElementById(`remote_video_${data.name}`);
    video && video.parentNode && video.parentNode.removeChild(video);
    
    const pc = peerConn[data.name];

    if(pc) {
      pc.close();
      pc.onicecandidate = null;
      pc.ontrack = null;
    } 
	}

	handleMsg(data) {
		console.log(data.message);
	}

	handleAnswer(data) {
    console.log("remote answer: ", data.answer);

		peerConn[data.name].setRemoteDescription(new RTCSessionDescription(data.answer));
	}

	handleCandidate(data) {
		peerConn[data.name].addIceCandidate(new RTCIceCandidate(data.candidate));
	}

	handleOffer(data) {
    const pc = peerConn[data.name];
    
    console.log("remote offer: ", data.offer);

		pc.setRemoteDescription(new RTCSessionDescription(data.offer));
		// Create an answer to an offer
		pc.createAnswer(
			answer => {
				pc.setLocalDescription(answer);
				this.send({
					event: 'answer',
					answer: answer,
					connectedUser: data.name
				});
			},
			error => {
				alert('Error when creating an answer');
			}
		);
	}

	send(message) {
		this.socket.send(JSON.stringify(message));
	}

	handleLogin(data) {
		if (data.success === false) {
			message.info('Ooops...try a different username');
		} else {
			const users = data.users;

			this.setState({
				show: false,
				users
			});

			const newUser = users[users.length - 1];
			// If new user is youself
			if (newUser === this.state.name) {
				this.initCreate();
			} else {
				// New user is not youself
        const pc = this.createPeerConnection(newUser);
        
        console.log("pc: ", pc);

        // const cloneMedia = localStream.clone();

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        cloneLocalStream.getTracks().forEach((track) => pc.addTrack(track, cloneLocalStream));
			}
		}
	}

	async initCreate() {
		const { users, name } = this.state;
		// New webrtc API
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: {
        aspectRatio: 1.778,
        resizeMode: 'crop-and-scale',
        width: {exact: 640},
        height: {exact: 480}
      } });


      // if (navigator.mediaDevices.getDisplayMedia) {
      //   captureStream = await navigator.mediaDevices.getDisplayMedia({video: {mediaSource: 'screen'}})
      // } else if(navigator.getDisplayMedia)  {
      //   captureStream = await navigator.getDisplayMedia({video: {mediaSource: 'screen'}})
      // }      

			const video = document.getElementById('localVideo');
			// const screenVideo = document.getElementById('screenVideo');

      this.addVideoURL('localVideo', stream);
      // if(captureStream) {
      //   this.addVideoURL('screenVideo', captureStream);
      // }
      
			video.muted = true;
      // screenVideo.muted = true;
      
      // if(captureStream) {
      //   screenStream = captureStream;
      // }
      // console.log("screenStream: ", screenStream);
      
      localStream = stream;
      
      cloneLocalStream = stream.clone();

      console.log("localStream: ", localStream.id);
      console.log("cloneLocalStream: ", cloneLocalStream.id);

      const track = cloneLocalStream.getVideoTracks()[0];

      console.log("cloneLocalStream track: ", track);

      const res = await track.applyConstraints({
        audio: true,
        video: {
          aspectRatio: 1.778,
          resizeMode: 'crop-and-scale',
          width: { min: 1024, ideal: 1280, max: 1920 },
          height: { min: 776, ideal: 720, max: 1080 }
        }
      })

      console.log("cloneLocalStream track 2: ", track, "  res: ", res);

			if (users.length !== 1 && users[users.length - 1] === name) {
				this.call();
			}
		} catch (err) {
			console.log(err.name + ': ' + err.message);
		}
	}

	call() {
		this.createPeerConnections();
		this.addStreams();
		this.sendOffers();
	}

	sendOffers() {
		const { users, name } = this.state;

		for (var i = 0, len = users.length; i < len; i++) {
			if (users[i] !== name) {
				this.sendOffer(users[i]);
			}
		}
	}

	sendOffer(name) {
		const pc = peerConn[name];

		pc.createOffer(
			offer => {
				this.send({
					event: 'offer',
					offer: offer,
					connectedUser: name
				});
				pc.setLocalDescription(offer);
			},
			error => {
				alert('Error when creating an offer');
			}
		);
	}

	createPeerConnections() {
		const { users, name } = this.state;

		for (var i = 0; i < users.length; i++) {
			if (users[i] !== name) {
				this.createPeerConnection(users[i]);
			}
		}
	}

	createPeerConnection(name) {
    const pc = (peerConn[name] = new RTCPeerConnection(configuration));
  
    // 监听 B 的ICE候选信息 如果收集到，就添加给 A
		pc.onicecandidate = event => {
			setTimeout(() => {
				if (event.candidate) {
					this.send({
						event: 'candidate',
						candidate: event.candidate,
						name: name
					});
				}
			});
		};

		// pc.onaddstream = function(e) {
    //   console.log("add stream: ", e);
    //         const child = document.createElement('video');
    //         child.id = `remote_video_${name}`;
    //         child.autoplay = 'autoplay';
    //         child.srcObject = e.stream;
    //         document.getElementById('remoteVideo').appendChild(child);
		// };

    pc.ontrack = function(e) {
      console.log("-------------");
      console.log("on track: ", e.streams[0].id);
      console.log("-------------");

      if(e.track.kind === "video") {
        const child = document.createElement('video');
        child.id = `remote_video_${name}`;
        child.autoplay = 'autoplay';
        child.srcObject = e.streams[0];
        document.getElementById('remoteVideo').appendChild(child);
        console.log("track getsetting: ", e.track.getSettings());

      }
			// const child = document.createElement('video');
			// child.id = `remote_video_${name}`;
			// child.autoplay = 'autoplay';
			// child.srcObject = e.stream;
			// document.getElementById('remoteVideo').appendChild(child);
		};

		return pc;
	}

	addStreams() {
    const addTrack = (connection) => {
      localStream.getTracks().forEach((track) => peerConn[connection].addTrack(track, localStream))
      cloneLocalStream.getTracks().forEach((track) => peerConn[connection].addTrack(track, cloneLocalStream))
      if(screenStream) {
        screenStream.getTracks().forEach((track) => peerConn[connection].addTrack(track, screenStream))
      }
    };

		for (let connection in peerConn) {
      addTrack(connection);
		}
	}

	addVideoURL(elementId, stream) {
		const video = document.getElementById(elementId);

		// Old brower may have no srcObject
		if ('srcObject' in video) {
			video.srcObject = stream;
		} else {
			// 防止在新的浏览器里使用它，应为它已经不再支持了
			video.src = window.URL.createObjectURL(stream);
		}
	}

	handleSubmit(e) {
		e.preventDefault();

		this.props.form.validateFields((err, values) => {
			if (!err) {
				this.setState(
					{
						name: values.name
					},
					() => {
						if (this.state.name !== '') {
							this.send({
								event: 'join',
								name: this.state.name,
								room: this.state.roomID
							});
						}
					}
				);
			}
		});
	}

	renderView() {
		const { show, name, roomID, users } = this.state;

		if (!show) {
			return (
				<div>
					<Row>
						<Col xs={24} sm={6}>
							<ul className="list-group">
								<li className="list-group-item">您的名称: { name }</li>
								<li className="list-group-item">当前房间号: { roomID }</li>
								<li className="list-group-item">当前在线人数: { users.length }</li>
								<li className="list-group-item">在线用户: { JSON.stringify(users) }</li>
							</ul>
						</Col>
						<Col xs={24} sm={17}>
              <h3>remote video: </h3>
							<div id="remoteVideo" />

              <h3>local video: </h3>
							<div id="local">
								<video id="localVideo" autoPlay />
							</div>
							<div id="screen">
								<video id="screenVideo" autoPlay />
							</div>
						</Col>
					</Row>
				</div>
			);
		}

		return null;
	}

	render() {
		const { getFieldDecorator } = this.props.form;
		const { show } = this.state;

		return (
			<div className="container">
				{show && (
					<Row>
						<Col xs={0} sm={5} />
						<Col xs={24} sm={14}>
							<h2>输入入会名称：</h2>

							<div>
								<Form onSubmit={this.handleSubmit} className="login-form">
									<Form.Item>
										{getFieldDecorator('name', {
											rules: [{ required: true, message: 'Please input your name!' }]
										})(
											<Input
												prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
												placeholder="输入入会名称"
												autoComplete="off"
											/>
										)}
									</Form.Item>
									<Form.Item>
										<Button type="primary" htmlType="submit" className="login-form-button">
											确定
										</Button>
									</Form.Item>
								</Form>
							</div>
						</Col>
					</Row>
				)}
				{this.renderView()}
			</div>
		);
	}
}

export default Form.create({})(Room);
