import React from 'react';
import './App.css';
import { HashRouter as Router, Route, NavLink } from 'react-router-dom';
import Index from './view/index';
import Webrtc from './view/webrtc/index';

function App() {
	return (
		<Router>
			<div className="App">
				<ul className="nav">
					<li>
						<NavLink
							to="/"
							exact
							activeStyle={{
								fontWeight: 'bold',
								color: 'blue'
							}}
						>
							介绍webrtc
						</NavLink>
					</li>
					<li>
						<NavLink
							to="/webrtc"
							activeStyle={{
								fontWeight: 'bold',
								color: 'blue'
							}}
						>
							Webrtc
						</NavLink>
					</li>
				</ul>

				<Route path="/" exact component={Index} />
				<Route path="/webrtc" component={Webrtc} />
			</div>
		</Router>
	);
}

export default App;
