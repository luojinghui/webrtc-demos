import React from 'react';
import './App.css';
import { HashRouter as Router, Route, NavLink } from 'react-router-dom';
import Index from './view/index';
import Webrtc from './view/webrtc/index';
import TransText from './view/transText/index';
import BaseConnection from './view/baseConnection/index';
import AdjustBandWidth from './view/adjustBandWidth/index';
import Room from './view/room/index';

function App() {
  const isActive = (match, location) => {
    const { pathname } = location;
    
    return (pathname === "/" || pathname.includes("/room"));
  }

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
              isActive={isActive}
						>
							rtc 多点呼叫
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
							snapshat/清晰度
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
							basePeerConnection
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
				<Route path="/room/:room" component={Room} />
			</div>
		</Router>
	);
}

export default App;
