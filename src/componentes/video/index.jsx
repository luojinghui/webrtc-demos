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
    const { control = false } = this.props;

		return (
			<div className="video">
				<video
          controls={control}
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
