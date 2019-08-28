/* eslint-disable no-undef */
import React, { Component } from 'react';
import { Form, Icon, Input, Button, Table, Row, Col } from 'antd';
import * as config from '../../configure';
import socketIOClient from 'socket.io-client';
import { Link } from 'react-router-dom'

const columns = [
	{
		title: '房间号',
    dataIndex: 'room',
    render: text => (<Link to={ `/room/${text}` }>{ text }</Link>)
    ,
	},
	{
		title: '用户',
		dataIndex: 'user'
	}
];

const socket = socketIOClient(config.API_ROOT);

class WrappedIndex extends Component {
	constructor(props) {
		super(props);

		this.state = {
			rooms: [],
			roomName: ''
    };
    
    this.isUnmount = false;
	}

	componentDidMount() {
		socket.emit(
			'message',
			JSON.stringify({
				event: 'get_room_info'
			})
		);

		socket.on('message', data => {
			const parseData = JSON.parse(data);

			console.log('parseData: ', parseData);
			switch (parseData.event) {
				case 'show':
          const allUser = parseData.allUser;
          let newRooms = [];

          for(let key in allUser) {
            newRooms.push({
              key, 
              user: allUser[key].join(","),
              room: key
            })
          }

          if(!this.isUnmount) {
            this.setState({
              rooms: newRooms
            })
          }
					break;
				default:
					break;
			}
		});
  }
  
  componentWillUnmount() {
    this.isUnmount = true;
  }

	handleSubmit = e => {
		e.preventDefault();

		this.props.form.validateFields((err, values) => {
			if (!err) {
				this.setState(
					{
						roomName: values.roomId
					},
					() => {
						console.log('this.porops: ', values);
						this.props.history.push(`room/${this.state.roomName}`);
					}
				);
			}
		});
	};

	render() {
		const { getFieldDecorator } = this.props.form;
		const { rooms } = this.state;

		return (
			<div>
				<Row>
					<Col xs={0} sm={5} />
					<Col xs={24} sm={14}>
						<h2>WebRTC 多点呼叫 Demo</h2>

						<div>
							<Form onSubmit={this.handleSubmit} className="login-form">
								<Form.Item>
									{getFieldDecorator('roomId', {
										rules: [{ required: true, message: 'Please input your room id!' }]
									})(
										<Input
											prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
											placeholder="输入房间号"
											autoComplete="off"
										/>
									)}
								</Form.Item>
								<Form.Item>
									<Button type="primary" htmlType="submit" className="login-form-button">
										创建房间
									</Button>
								</Form.Item>
							</Form>
						</div>
					</Col>
				</Row>

				<Row>
					<Col xs={0} sm={5} />
					<Col xs={24} sm={14}>
						<div className="left">
							<h3>Current Rooms:</h3>
							<Table columns={columns} dataSource={rooms} pagination={false} />
						</div>
					</Col>
				</Row>
			</div>
		);
	}
}

export default Form.create({ name: 'normal_login' })(WrappedIndex);
