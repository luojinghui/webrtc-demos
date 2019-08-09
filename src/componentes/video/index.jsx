import React, { Component } from 'react';

export default class Video extends Component {
  componentDidMount() {
		this.video.srcObject = this.props.media;
	}

	componentDidUpdate() {
		this.video.srcObject = this.props.media;
  }
  
  getVideoRef() {
    return this.video;
  }

	render() {
		return (
			<div className="video">
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
