import React, { Component } from 'react';

export default class Video extends Component {
	componentDidMount() {
		this.video.srcObject = this.props.media;
	}

	componentDidUpdate() {
		this.video.srcObject = this.props.media;
	}

	render() {
		return (
			<div>
				<video
					autoPlay
					playsInline
					ref={video => {
						this.video = video;
					}}
				/>
			</div>
		);
	}
}
