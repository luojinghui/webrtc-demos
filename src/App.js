import React from 'react';
import './App.css';
import { HashRouter as Router, Route, NavLink } from 'react-router-dom';
import Index from './view/index';
import Webrtc from './view/webrtc/index';
import TransText from './view/transText/index';
import BaseConnection from './view/baseConnection/index';
import AdjustBandWidth from './view/adjustBandWidth/index';

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
          <li>
						<NavLink
							to="/transText"
							activeStyle={{
								fontWeight: 'bold',
								color: 'blue'
							}}
						>
							transText
						</NavLink>
					</li>
          <li>
						<NavLink
							to="/baseConnection"
							activeStyle={{
								fontWeight: 'bold',
								color: 'blue'
							}}
						>
							baseConnection
						</NavLink>
					</li>
          <li>
						<NavLink
							to="/adjustBandWidth"
							activeStyle={{
								fontWeight: 'bold',
								color: 'blue'
							}}
						>
							adjustBandWidth
						</NavLink>
					</li>          
				</ul>

				<Route path="/" exact component={Index} />
				<Route path="/webrtc" component={Webrtc} />
				<Route path="/transText" component={TransText} />
				<Route path="/baseConnection" component={BaseConnection} />
				<Route path="/adjustBandWidth" component={AdjustBandWidth} />
			</div>
		</Router>
	);
}

export default App;
