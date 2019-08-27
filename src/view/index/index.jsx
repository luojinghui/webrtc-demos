import React, { Component } from 'react';
import { Button } from 'antd';

export default class Index extends Component {
	render() {
		return (
			<div>
				<div>
					<Button type="primary">Primary</Button>
					<Button>Default</Button>
					<Button type="dashed">Dashed</Button>
					<Button type="danger">Danger</Button>
					<Button type="link">Link</Button>
				</div>
			</div>
		);
	}
}
